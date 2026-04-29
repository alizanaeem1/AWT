import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";

export default function Topbar({ searchQuery, onSearchChange, onGoSettings, onToggleSidebar }) {
  const { user, theme, toggleTheme, logout, notifications, unreadNotificationCount, markNotificationsRead, clearNotifications } =
    useApp();
  const isDark = theme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifPanel, setNotifPanel] = useState(null);
  const menuRef = useRef(null);
  const initials = (user?.fullName || "U").slice(0, 1).toUpperCase();
  const panelItems = useMemo(() => notifications, [notifications]);

  useEffect(() => {
    function onDocClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
        setNotifPanel(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function openNotifPanel() {
    const next = notifPanel ? null : "open";
    setNotifPanel(next);
    setMenuOpen(false);
    if (next) markNotificationsRead();
  }

  return (
    <header className="mb-6 flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
      <div
        className={`flex w-full flex-1 items-center gap-3 rounded-full border px-4 py-2.5 shadow-sm md:max-w-xl ${
          isDark ? "border-white/[0.08] bg-app-card" : "border-slate-200 bg-white"
        }`}
      >
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`mr-1 inline-flex h-7 w-7 items-center justify-center rounded md:hidden ${
            isDark ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Open navigation"
        >
          ☰
        </button>
        <span className={`shrink-0 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`} aria-hidden>
          ⌕
        </span>
        <input
          placeholder="Search semesters, courses, assignments…"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className={`w-full min-w-0 bg-transparent text-sm outline-none ${
            isDark ? "text-slate-200 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
          }`}
        />
      </div>

      <div className="relative flex flex-wrap items-center justify-end gap-2" ref={menuRef}>
        <button
          type="button"
          onClick={openNotifPanel}
          className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
            isDark
              ? "border-white/[0.08] bg-app-surface text-slate-300 hover:bg-white/[0.04]"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
          title="Notifications"
        >
          🔔
          {unreadNotificationCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-indigo-500 px-0.5 text-[10px] font-semibold text-white">
              {unreadNotificationCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg leading-none transition ${
            isDark
              ? "border-white/[0.08] bg-app-surface text-amber-200 hover:bg-white/[0.08]"
              : "border-slate-200 bg-slate-50 text-indigo-700 hover:bg-slate-100"
          }`}
          title={isDark ? "Light mode" : "Dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? "🌙" : "☀️"}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full border px-2 py-1.5 pl-1.5 text-sm transition ${
            isDark
              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/15"
              : "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
              isDark ? "bg-indigo-500/40 text-white" : "bg-indigo-600 text-white"
            }`}
          >
            {initials}
          </span>
          <span>{user?.fullName}</span>
        </button>

        {menuOpen ? (
          <div
            className={`absolute right-0 top-12 z-20 min-w-40 rounded-lg border p-1.5 shadow-xl ${
              isDark ? "border-gray-700 bg-gray-900" : "border-slate-200 bg-white"
            }`}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                onGoSettings?.();
              }}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                isDark ? "text-gray-200 hover:bg-gray-800" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                isDark ? "text-rose-300 hover:bg-rose-500/10" : "text-rose-600 hover:bg-rose-50"
              }`}
            >
              Logout
            </button>
          </div>
        ) : null}

        {notifPanel ? (
          <div
            className={`absolute right-0 top-12 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-xl border p-2 shadow-xl ${
              isDark ? "border-white/[0.08] bg-app-card" : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Notifications
              </p>
              <button
                type="button"
                onClick={() => clearNotifications()}
                className={`text-xs ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                Clear
              </button>
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
              {panelItems.length === 0 ? (
                <p className={`rounded-lg px-2 py-3 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  No notifications yet.
                </p>
              ) : (
                panelItems.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-lg border px-2.5 py-2 ${
                      isDark ? "border-white/[0.06] bg-app-surface/70" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{item.title}</p>
                    <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{item.message}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
