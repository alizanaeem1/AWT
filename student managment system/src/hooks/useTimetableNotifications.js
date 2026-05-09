import { useEffect, useRef } from "react";
import { format, getDay } from "date-fns";
import { desktopAPI } from "../utils/desktopApi";

const STORAGE_KEY = "sms-timetable-notified";

function parseTimeOnDate(baseDate, timeStr) {
  const [h, m] = String(timeStr || "0:0").split(":").map((x) => parseInt(x, 10));
  const d = new Date(baseDate);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

export function useTimetableNotifications({ user, activeSemester, dataVersion, pushNotification, pushToast }) {
  const pushN = useRef(pushNotification);
  const pushT = useRef(pushToast);
  const notifiedMap = useRef({});

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
    if (!user?.id || !activeSemester?.id) return;

    function markKey(key) {
      notifiedMap.current = { ...notifiedMap.current, [key]: true };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifiedMap.current));
      } catch {
        /* ignore */
      }
    }

    function run() {
      (async () => {
        const res = await desktopAPI.timetable.listBySemester({
          semesterId: activeSemester.id,
          userId: user.id
        });
        if (!res.ok) return;
        const entries = res.data || [];
        const now = Date.now();
        const today = new Date();
        const dow = getDay(today);
        const todayYmd = format(today, "yyyy-MM-dd");

        for (const entry of entries) {
          if (!entry.enabled) continue;
          if (Number(entry.dayOfWeek) !== dow) continue;

          const classStart = parseTimeOnDate(today, entry.startTime);
          const leadMs = Math.max(0, Number(entry.notifyMinutesBefore) || 0) * 60 * 1000;
          const triggerAt = classStart.getTime() - leadMs;

          const key = `timetable-${entry.id}-${todayYmd}`;
          if (notifiedMap.current[key]) continue;

          const withinWindow = now >= triggerAt && now <= triggerAt + 60 * 60 * 1000;
          if (!withinWindow) continue;

          const startLabel = format(classStart, "HH:mm");
          const endLabel = String(entry.endTime || "").trim() || "—";
          const loc = entry.location ? ` · ${entry.location}` : "";
          const whenNote =
            leadMs > 0
              ? `Starts at ${startLabel}–${endLabel}${loc} (${entry.notifyMinutesBefore} min before).`
              : `Starts at ${startLabel}–${endLabel}${loc}.`;

          const message = `${entry.title}: ${whenNote}`;

          try {
            if (typeof desktopAPI?.notify === "function") {
              desktopAPI.notify({
                title: "Class reminder",
                body: message,
                dedupeKey: key,
                kind: "timetable"
              });
            }
          } catch {
            /* browser */
          }
          pushN.current({
            title: "Class reminder",
            message,
            kind: "timetable",
            dedupeKey: key
          });
          pushT.current({
            title: "Class reminder",
            message,
            variant: "info",
            durationMs: 6500
          });
          markKey(key);
        }
      })();
    }

    run();
    const t = setInterval(run, 60 * 1000);
    return () => clearInterval(t);
  }, [user?.id, activeSemester?.id, dataVersion]);
}
