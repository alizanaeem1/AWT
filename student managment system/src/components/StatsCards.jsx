import React from "react";
import { useApp } from "../context/AppContext";

export default function StatsCards({ stats }) {
  const { theme } = useApp();
  const isDark = theme === "dark";
  const cardClass = isDark
    ? "rounded-2xl border border-white/[0.06] p-5 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5";
  const titleClass = isDark ? "text-sm font-medium text-slate-300" : "text-sm font-medium text-slate-600";
  const valueClass = isDark ? "mt-1 text-3xl font-bold tabular-nums text-white" : "mt-1 text-3xl font-bold tabular-nums text-slate-800";
  const subtitleClass = isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500";
  const darkBg = [
    "bg-gradient-to-br from-indigo-500/20 to-indigo-900/30",
    "bg-gradient-to-br from-violet-500/20 to-violet-900/30",
    "bg-gradient-to-br from-emerald-500/20 to-emerald-900/30",
    "bg-gradient-to-br from-amber-500/20 to-amber-900/30"
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <article className={`${cardClass} ${isDark ? darkBg[0] : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={titleClass}>🌌 GPA</p>
            <h3 className={valueClass}>{stats.currentGpa ?? 0}</h3>
            <p className={subtitleClass}>Good job! 🚀</p>
          </div>
          <span className="text-5xl leading-none drop-shadow-[0_6px_14px_rgba(99,102,241,0.35)]">🎓</span>
        </div>
      </article>
      <article className={`${cardClass} ${isDark ? darkBg[1] : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={titleClass}>⭐ CGPA</p>
            <h3 className={valueClass}>{stats.cgpa != null && stats.cgpa !== "" ? stats.cgpa : "—"}</h3>
            <p className={subtitleClass}>Cumulative</p>
          </div>
          <span className="text-5xl leading-none drop-shadow-[0_6px_14px_rgba(168,85,247,0.35)]">🏆</span>
        </div>
      </article>
      <article className={`${cardClass} ${isDark ? darkBg[2] : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={titleClass}>📚 Total Courses</p>
            <h3 className={valueClass}>{stats.totalSubjects ?? 0}</h3>
            <p className={subtitleClass}>Across semesters</p>
          </div>
          <span className="text-5xl leading-none drop-shadow-[0_6px_14px_rgba(16,185,129,0.35)]">📚</span>
        </div>
      </article>
      <article className={`${cardClass} ${isDark ? darkBg[3] : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={titleClass}>⏰ Pending</p>
            <h3 className={valueClass}>{stats.pendingAssignments ?? 0}</h3>
            <p className={subtitleClass}>
              {Number(stats.overdueAssignments) > 0 ? `${stats.overdueAssignments} overdue` : "Due today or later"}
            </p>
          </div>
          <span className="text-5xl leading-none drop-shadow-[0_6px_14px_rgba(245,158,11,0.35)]">⏰</span>
        </div>
      </article>
    </section>
  );
}
