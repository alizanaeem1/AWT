import { useEffect, useRef } from "react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { desktopAPI } from "../utils/desktopApi";

const STORAGE_KEY = "sms-due-today-notified";
const REMINDER_NOTIFIED_KEY = "sms-reminder-notified";

/**
 * Fetches assignments for the active term on an interval:
 * - Due today: bell + toast + OS notification (once per item per day).
 * - Reminder time: 1h / 2h before reminderAt (same notifications; once per window);
 *   runs app-wide so reminders work when not on Dashboard.
 */
export function useDueTodayNotifications({ activeSemester, dataVersion, pushNotification, pushToast }) {
  const pushN = useRef(pushNotification);
  const pushT = useRef(pushToast);
  const notifiedMap = useRef({});
  const reminderNotifiedRef = useRef({});

  useEffect(() => {
    pushN.current = pushNotification;
    pushT.current = pushToast;
  }, [pushNotification, pushToast]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      notifiedMap.current = raw ? JSON.parse(raw) : {};
    } catch {
      notifiedMap.current = {};
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMINDER_NOTIFIED_KEY);
      reminderNotifiedRef.current = raw ? JSON.parse(raw) : {};
    } catch {
      reminderNotifiedRef.current = {};
    }
  }, []);

  useEffect(() => {
    if (!activeSemester?.id) return;

    function markKey(key) {
      notifiedMap.current = { ...notifiedMap.current, [key]: true };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifiedMap.current));
      } catch {
        /* ignore */
      }
    }

    function markReminderNotified(key) {
      reminderNotifiedRef.current = { ...reminderNotifiedRef.current, [key]: true };
      try {
        localStorage.setItem(REMINDER_NOTIFIED_KEY, JSON.stringify(reminderNotifiedRef.current));
      } catch {
        /* ignore */
      }
    }

    function notifyBeforeReminder(items) {
      const now = Date.now();
      const leadWindows = [
        { label: "2h", ms: 2 * 60 * 60 * 1000, text: "2 hours" },
        { label: "1h", ms: 1 * 60 * 60 * 1000, text: "1 hour" }
      ];

      for (const item of items || []) {
        if (item.status !== "pending" || !item.reminderAt) continue;
        const reminderTime = parseISO(item.reminderAt);
        if (Number.isNaN(reminderTime.getTime())) continue;

        for (const lead of leadWindows) {
          const triggerAt = reminderTime.getTime() - lead.ms;
          const key = `${item.id}:${item.reminderAt}:${lead.label}`;
          const alreadyNotified = reminderNotifiedRef.current[key];

          // Trigger within a 60-minute window so brief backgrounding still catches the alert.
          const withinWindow = now >= triggerAt && now <= triggerAt + 60 * 60 * 1000;
          if (!alreadyNotified && withinWindow) {
            const message = `${String(item.type || "assignment").toUpperCase()} "${item.title}" (${item.subjectName || "Course"}) starts at ${format(
              reminderTime,
              "dd MMM yyyy HH:mm"
            )}. Reminder: ${lead.text} before.`;
            try {
              if (typeof desktopAPI?.notify === "function") {
                desktopAPI.notify({ title: "Assignment Reminder", body: message });
              }
            } catch {
              /* browser / no bridge */
            }
            pushN.current({
              title: "Reminder Alert",
              message,
              kind: "reminder",
              dedupeKey: key
            });
            pushT.current({
              title: "Reminder Alert",
              message,
              variant: "warning",
              durationMs: 6000
            });
            markReminderNotified(key);
          }
        }
      }
    }

    function run() {
      (async () => {
        const res = await desktopAPI.assignments.listBySemester(activeSemester.id);
        if (!res.ok) return;
        const items = res.data || [];
        notifyBeforeReminder(items);

        const todayYmd = format(new Date(), "yyyy-MM-dd");
        for (const item of items) {
          if (item.status !== "pending" || !item.dueDate) continue;
          const due = parseISO(item.dueDate);
          if (Number.isNaN(due.getTime())) continue;
          if (differenceInCalendarDays(due, new Date()) !== 0) continue;

          const key = `due-today-${item.id}-${todayYmd}`;
          if (notifiedMap.current[key]) continue;

          const isQuiz = String(item.type || "").toLowerCase() === "quiz";
          const typeLabel = isQuiz ? "Quiz" : "Assignment";
          const sub = item.subjectName || "course";
          const message = `${typeLabel} "${item.title}" (${sub}) is due today.`;

          try {
            if (typeof desktopAPI?.notify === "function") {
              desktopAPI.notify({ title: "Due today", body: message });
            }
          } catch {
            /* browser / no bridge */
          }
          pushN.current({
            title: "Due today",
            message,
            kind: "general",
            dedupeKey: key
          });
          pushT.current({
            title: "Due today",
            message,
            variant: "warning",
            durationMs: 8000
          });
          markKey(key);
        }
      })();
    }

    run();
    const t = setInterval(run, 60 * 1000);
    return () => clearInterval(t);
  }, [activeSemester?.id, dataVersion]);
}
