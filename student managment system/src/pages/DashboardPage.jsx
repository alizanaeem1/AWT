import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { useApp } from "../context/AppContext";
import StatsCards from "../components/StatsCards";
import AnalyticsCharts from "../components/AnalyticsCharts";
import { desktopAPI } from "../utils/desktopApi";
import { computeCgpaDisplay } from "../utils/cgpaDisplay";

export default function DashboardPage() {
  const { user, activeSemester, semesters, overallCgpa, dataVersion, theme } = useApp();
  const isDark = theme === "dark";
  const [stats, setStats] = useState({});
  const [upcoming, setUpcoming] = useState([]);

  const displayCgpa = useMemo(
    () => computeCgpaDisplay(semesters, overallCgpa),
    [semesters, overallCgpa]
  );
  const statsForUi = useMemo(
    () => ({ ...stats, cgpa: displayCgpa }),
    [stats, displayCgpa]
  );

  useEffect(() => {
    if (!user || !activeSemester) return;
    fetchDashboard();
    fetchUpcoming();
    const timer = setInterval(() => {
      fetchUpcoming();
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [user, activeSemester, dataVersion]);

  async function fetchDashboard() {
    const res = await desktopAPI.analytics.dashboard({
      userId: user.id,
      semesterId: activeSemester.id,
      semesterName: activeSemester.name
    });
    if (res.ok) setStats(res.data);
  }

  async function fetchUpcoming() {
    const res = await desktopAPI.assignments.listBySemester(activeSemester.id);
    if (!res.ok) return;
    const pending = res.data
      .filter((item) => item.status === "pending")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map((item) => ({
        ...item,
        dueIn: differenceInCalendarDays(parseISO(item.dueDate), new Date())
      }));
    setUpcoming(pending);
  }

  function gradeLabel(value) {
    if (value >= 3.7) return "A";
    if (value >= 3.3) return "B+";
    if (value >= 3.0) return "B";
    if (value >= 2.7) return "B-";
    return "C";
  }

  if (!activeSemester) {
    return (
      <div
        className={`rounded-2xl border p-8 text-center ${
          isDark
            ? "border-dashed border-white/10 bg-app-card/50 text-slate-500"
            : "border-dashed border-slate-300 bg-white text-slate-500"
        }`}
      >
        Create your first semester to start tracking courses, assignments, files, and GPA.
      </div>
    );
  }

  return (
    <div className="transition-all duration-300">
      <div className="mb-4">
        <h2 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Dashboard 👋</h2>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>Overview for {activeSemester.name}</p>
      </div>

      <StatsCards stats={statsForUi} />
      <AnalyticsCharts stats={stats} />

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          className={`rounded-2xl border p-4 ${
            isDark ? "border-white/[0.06] bg-app-card shadow-card" : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          <h3 className={`mb-3 text-sm font-semibold ${isDark ? "text-gray-300" : "text-slate-700"}`}>🕒 Upcoming Deadlines</h3>
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <p className={`text-sm ${isDark ? "text-gray-500" : "text-slate-500"}`}>No pending items.</p>
            ) : (
              upcoming.map((item) => (
                <article
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    isDark ? "bg-gray-800/70" : "border border-slate-200 bg-slate-50"
                  }`}
                >
                  <div>
                    <p className={`text-sm ${isDark ? "text-white" : "text-slate-800"}`}>🟠 {item.title}</p>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                      {item.subjectName} - {format(parseISO(item.dueDate), "dd MMM yyyy")}
                    </p>
                    {item.reminderAt && !Number.isNaN(parseISO(item.reminderAt).getTime()) ? (
                      <p className={`text-xs ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>
                        🔔 Reminder {format(parseISO(item.reminderAt), "dd MMM, HH:mm")}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-amber-300">{item.dueIn} day(s) left</span>
                </article>
              ))
            )}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            isDark ? "border-white/[0.06] bg-app-card shadow-card" : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          <h3 className={`mb-3 text-sm font-semibold ${isDark ? "text-gray-300" : "text-slate-700"}`}>📋 Recent Activity</h3>
          <div className="space-y-2">
            {(stats.recentActivity || []).length === 0 ? (
              <p className={`text-sm ${isDark ? "text-gray-500" : "text-slate-500"}`}>No activity yet.</p>
            ) : (
              (stats.recentActivity || []).slice(0, 5).map((item, index) => (
                <article
                  key={`${item.label}-${index}`}
                  className={`rounded-lg p-3 ${isDark ? "bg-gray-800/70" : "border border-slate-200 bg-slate-50"}`}
                >
                  <p className={`text-sm ${isDark ? "text-white" : "text-slate-800"}`}>📄 {item.label}</p>
                  <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{item.when || "Recently"}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            isDark ? "border-white/[0.06] bg-app-card shadow-card" : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          <h3 className={`mb-3 text-sm font-semibold ${isDark ? "text-gray-300" : "text-slate-700"}`}>⭐ Top Subjects (By GPA)</h3>
          <div className="space-y-3">
            {(stats.subjectPerformance || []).slice(0, 5).map((item) => {
              const value = Number(item.gradePoint || 0);
              const width = `${Math.max(6, Math.min(100, (value / 4) * 100))}%`;
              return (
                <article key={item.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>{item.name}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{gradeLabel(value)}</span>
                      <span className={`text-xs font-semibold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>{value.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" style={{ width }} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
