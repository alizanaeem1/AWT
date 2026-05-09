import React from "react";
import { useApp } from "../context/AppContext";

const navItems = [
  { route: "Dashboard", label: "Dashboard", icon: "🏠" },
  { route: "Semesters", label: "Semesters", icon: "🗓️" },
  { route: "Courses", label: "Subjects", icon: "📚" },
  { route: "Assignments & Quiz", label: "Assignments & Quiz", icon: "📝" },
  { route: "Files", label: "Files", icon: "📁" },
  { route: "Analytics", label: "Analytics", icon: "📊" },
  { route: "Daily Progress", label: "Daily Progress", icon: "✍️" },
  { route: "Calendar", label: "Calendar", icon: "📅" },
  { route: "Notifications", label: "Notifications", icon: "🔔" },
  { route: "Settings", label: "Settings", icon: "⚙️" }
];

export default function Sidebar({ active, onSelect, isOpen = false, onClose }) {
  const { logout, theme, unreadNotificationCount } = useApp();
  const isDark = theme === "dark";

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col p-4 transition-transform duration-300 md:sticky md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDark
            ? "border-r border-white/[0.06] bg-app-surface"
            : "border-r border-slate-200 bg-white"
        }`}
      >
      <h1 className={`mb-0.5 text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>🎓 Student Management</h1>
      <p className="mb-1 text-xs text-indigo-400">System</p>
      <div className={`mb-5 h-px w-20 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
      <nav className="space-y-1.5">
        {navItems.map((item) => (
          <button
            key={item.route}
            type="button"
            className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              active === item.route
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                : isDark
                  ? "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            onClick={() => onSelect(item.route)}
          >
            <span
              className={`mr-2.5 text-xs ${
                active === item.route ? "text-white/90" : isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.route === "Notifications" && unreadNotificationCount > 0 ? (
              <span className="rounded-md bg-indigo-500 px-1.5 py-0.5 text-[10px] text-white">{unreadNotificationCount}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-4">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl bg-rose-600/90 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-rose-500"
        >
          Logout
        </button>
      </div>
      </aside>
      {isOpen ? <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} /> : null}
    </>
  );
}
