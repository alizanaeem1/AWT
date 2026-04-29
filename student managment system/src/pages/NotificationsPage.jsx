import React, { useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { useApp } from "../context/AppContext";

export default function NotificationsPage() {
  const { notifications, clearNotifications, markNotificationsRead, theme } = useApp();
  const isDark = theme === "dark";

  const sorted = useMemo(
    () =>
      [...(notifications || [])].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [notifications]
  );

  const shell = isDark
    ? "rounded-2xl border border-white/[0.06] bg-app-card p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Notifications</h2>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>
            Alerts, due-today reminders, and in-app messages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sorted.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => markNotificationsRead()}
                className={
                  isDark
                    ? "rounded-xl border border-white/10 bg-app-surface px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                    : "rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 transition hover:bg-slate-100"
                }
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={() => clearNotifications()}
                className={
                  isDark
                    ? "rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
                    : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-100"
                }
              >
                Clear all
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className={shell}>
        {sorted.length === 0 ? (
          <p className={`py-8 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>
            No notifications yet. Due-today items and other alerts will show up here and in the top-right bell.
          </p>
        ) : (
          <ul className="max-h-[min(32rem,70vh)] space-y-2 overflow-y-auto pr-1">
            {sorted.map((item) => {
              const t = item.createdAt ? parseISO(item.createdAt) : null;
              const timeLabel = t && isValid(t) ? format(t, "dd MMM yyyy, HH:mm") : "";
              return (
                <li key={item.id}>
                  <article
                    className={`rounded-xl border px-3 py-2.5 transition ${
                      isDark
                        ? item.read
                          ? "border-white/[0.06] bg-app-surface/50"
                          : "border-indigo-500/25 bg-app-surface/80 shadow-[0_0_0_1px_rgba(99,102,241,0.12)]"
                        : item.read
                          ? "border-slate-200 bg-slate-50/80"
                          : "border-indigo-200/80 bg-indigo-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                        {item.read ? null : (
                          <span
                            className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full bg-indigo-500"
                            title="Unread"
                            aria-label="Unread"
                          />
                        )}
                        {item.title}
                      </p>
                      {timeLabel ? (
                        <time
                          dateTime={item.createdAt}
                          className={`shrink-0 text-[10px] tabular-nums ${isDark ? "text-slate-500" : "text-slate-500"}`}
                        >
                          {timeLabel}
                        </time>
                      ) : null}
                    </div>
                    <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {item.message}
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
