import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";
import AnalyticsCharts from "../components/AnalyticsCharts";

function buildInsights(stats) {
  const completed = (stats.completion || []).find((item) => item.status === "completed")?.total || 0;
  const pending = (stats.completion || []).find((item) => item.status === "pending")?.total || 0;
  const overdue = (stats.completion || []).find((item) => item.status === "overdue")?.total || 0;
  const total = completed + pending + overdue;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const bestSubject = stats.subjectPerformance?.[0];
  const gpaDelta =
    stats.gpaTrend?.length >= 2 ? Number(stats.gpaTrend.at(-1).gpa || 0) - Number(stats.gpaTrend.at(-2).gpa || 0) : 0;

  return [
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      hint: completionRate >= 70 ? "Great momentum this semester." : "Focus on clearing pending tasks."
    },
    {
      title: "Best Performing Course",
      value: bestSubject ? `${bestSubject.name} (${bestSubject.gradePoint})` : "No graded subject yet",
      hint: "Highest grade point currently recorded."
    },
    {
      title: "GPA Direction",
      value: gpaDelta === 0 ? "Stable" : gpaDelta > 0 ? `+${gpaDelta.toFixed(2)}` : gpaDelta.toFixed(2),
      hint: "Difference vs previous semester."
    }
  ];
}

export default function AnalyticsPage() {
  const { user, activeSemester, pushToast, dataVersion, theme } = useApp();
  const isDark = theme === "dark";
  const [stats, setStats] = useState({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user || !activeSemester) return;
    loadAnalytics();
  }, [user, activeSemester, dataVersion]);

  async function loadAnalytics() {
    const res = await desktopAPI.analytics.dashboard({
      userId: user.id,
      semesterId: activeSemester.id,
      semesterName: activeSemester.name
    });
    if (res.ok) setStats(res.data);
  }

  async function exportPdf() {
    if (!activeSemester) return;
    setExporting(true);
    const res = await desktopAPI.reports.exportGpaPdf({ semesterName: activeSemester.name });
    setExporting(false);
    if (!res.ok) {
      pushToast({ title: "Export failed", message: res.error || "Could not export PDF.", variant: "error" });
      return;
    }
    if (!res.data) return;
    pushToast({
      title: "Report exported",
      message: `Saved GPA report to ${res.data.filePath}`,
      variant: "success"
    });
  }

  const insights = useMemo(() => buildInsights(stats), [stats]);

  if (!activeSemester) {
    return (
      <div
        className={`rounded-xl border p-8 text-center ${
          isDark ? "border-dashed border-gray-700 bg-gray-900/50 text-gray-400" : "border-dashed border-slate-300 bg-white text-slate-500"
        }`}
      >
        Select or create a semester to view analytics.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <h2 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Analytics</h2>
        <div className="flex items-center gap-2">
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>Charts and productivity insights for {activeSemester.name}</p>
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-60"
          >
            {exporting ? "Exporting..." : "Export GPA PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {insights.map((item) => (
          <article
            key={item.title}
            className={`rounded-xl border p-4 transition-transform duration-300 hover:-translate-y-0.5 ${
              isDark ? "border-gray-800 bg-gray-900/70" : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            <p className={`text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-slate-500"}`}>{item.title}</p>
            <p className={`mt-2 text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{item.value}</p>
            <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{item.hint}</p>
          </article>
        ))}
      </div>

      <AnalyticsCharts stats={stats} />
    </div>
  );
}
