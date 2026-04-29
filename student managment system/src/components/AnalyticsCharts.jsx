import React from "react";
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useApp } from "../context/AppContext";

const completionPieFill = {
  completed: "#10b981",
  pending: "#f59e0b",
  overdue: "#ef4444"
};

export default function AnalyticsCharts({ stats }) {
  const { theme } = useApp();
  const isDark = theme === "dark";
  const panelClass = isDark
    ? "rounded-2xl border border-white/[0.06] bg-app-card p-4 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
    : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-0.5";
  const headingClass = isDark ? "mb-3 text-sm font-semibold text-slate-300" : "mb-3 text-sm font-semibold text-slate-600";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0";
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipStyle = isDark
    ? { backgroundColor: "#16182a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#e2e8f0" }
    : { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12 };

  const rawCompletion = stats.completion?.length
    ? stats.completion
    : [
        { status: "pending", total: 0 },
        { status: "completed", total: 0 },
        { status: "overdue", total: 0 }
      ];
  const completionOrder = { completed: 0, pending: 1, overdue: 2 };
  const completionData = [...rawCompletion].sort(
    (a, b) => (completionOrder[a.status] ?? 9) - (completionOrder[b.status] ?? 9)
  );
  const totalCompletion = completionData.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const completionPercent = totalCompletion
    ? Math.round(((completionData.find((item) => item.status === "completed")?.total || 0) / totalCompletion) * 100)
    : 0;
  const legendRows = [
    { label: "Completed", key: "completed", color: "#22c55e" },
    { label: "Pending", key: "pending", color: "#f59e0b" },
    { label: "Overdue", key: "overdue", color: "#ef4444" }
  ].map((entry) => {
    const value = Number(completionData.find((item) => item.status === entry.key)?.total || 0);
    const percent = totalCompletion ? Math.round((value / totalCompletion) * 100) : 0;
    return { ...entry, percent };
  });

  return (
    <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={`${panelClass} lg:col-span-2`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={headingClass}>📈 GPA Trend</h3>
          <button
            type="button"
            className={`rounded-md border px-2 py-1 text-xs ${
              isDark ? "border-white/10 bg-app-surface text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            All Semesters ▾
          </button>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stats.gpaTrend || []}>
              <defs>
                <linearGradient id="gpaArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="gpa" stroke="none" fill="url(#gpaArea)" />
              <Line type="monotone" dataKey="gpa" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        <h3 className={headingClass}>📊 Assignment Completion</h3>
        <div className="flex flex-col items-center gap-4 min-[1350px]:flex-row min-[1350px]:items-center">
          <div className="relative h-44 w-44 shrink-0 lg:h-48 lg:w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={completionData} dataKey="total" nameKey="status" outerRadius={74} innerRadius={46}>
                  {completionData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={completionPieFill[entry.status] || "#6366f1"}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{completionPercent}%</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>Completed</p>
            </div>
          </div>
          <div className="w-full min-w-0 flex-1 space-y-3">
            {legendRows.map((row) => (
              <div key={row.key} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: row.color }} />
                  <span className={`truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>{row.label}</span>
                </div>
                <span className={`tabular-nums ${isDark ? "text-slate-200" : "text-slate-800"}`}>{row.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
