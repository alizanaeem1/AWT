import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { format, isValid, parseISO } from "date-fns";
import { useApp } from "../context/AppContext";
import { computeCgpaDisplay, termGpaNum } from "../utils/cgpaDisplay";
import { desktopAPI } from "../utils/desktopApi";

function formatDate(s) {
  if (s == null || s === "") return "—";
  const t = String(s).trim();
  const a = parseISO(t);
  if (isValid(a)) return format(a, "MMM d, yyyy");
  const b = new Date(t);
  return isValid(b) ? format(b, "MMM d, yyyy") : t;
}

function toDateInput(s) {
  if (s == null || s === "") return "";
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const a = parseISO(t);
  if (isValid(a)) return format(a, "yyyy-MM-dd");
  const b = new Date(t);
  return isValid(b) ? format(b, "yyyy-MM-dd") : "";
}

function gpaLabel(g) {
  if (g == null || Number.isNaN(Number(g))) return "";
  const v = Number(g);
  if (v >= 3.7) return "Excellent";
  if (v >= 3.0) return "Good";
  if (v >= 2.0) return "Fair";
  if (v >= 0) return "Satisfactory";
  return "";
}

function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/** From DB: null = not set; 0..n = user saved in Add/Edit term. */
function termPlanNumber(expectedSubjects) {
  if (expectedSubjects == null || expectedSubjects === "") return null;
  const n = Number(expectedSubjects);
  return Number.isNaN(n) ? null : n;
}

function IconStatTotal({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconStatCheck({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconStatChart({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
function IconStatStar({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.41l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.41l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}
function IconCalendar({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M4.5 5.25h15a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5h-15a1.5 1.5 0 01-1.5-1.5V6.75A1.5 1.5 0 014.5 5.25z" />
    </svg>
  );
}
function IconEye({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

/** Inactive term border variants (active term uses emerald glow). */
const inactiveCardAccents = [
  "border-sky-500/45 shadow-[0_0_0_1px_rgba(56,189,248,0.12),0_8px_30px_-8px_rgba(0,0,0,0.5)]",
  "border-amber-500/45 shadow-[0_0_0_1px_rgba(245,158,11,0.1),0_8px_30px_-8px_rgba(0,0,0,0.5)]",
  "border-violet-500/45 shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_8px_30px_-8px_rgba(0,0,0,0.5)]",
  "border-indigo-500/45 shadow-[0_0_0_1px_rgba(99,102,241,0.12),0_8px_30px_-8px_rgba(0,0,0,0.5)]"
];

const statIconShell = (isDark, tone) => {
  const tones = {
    violet: isDark
      ? "bg-gradient-to-br from-violet-500/25 to-indigo-600/20 text-violet-200 ring-1 ring-violet-400/20"
      : "bg-violet-100 text-violet-600 ring-1 ring-violet-200",
    emerald: isDark
      ? "bg-gradient-to-br from-emerald-500/25 to-teal-600/20 text-emerald-200 ring-1 ring-emerald-400/20"
      : "bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200",
    blue: isDark
      ? "bg-gradient-to-br from-sky-500/25 to-blue-600/20 text-sky-200 ring-1 ring-sky-400/20"
      : "bg-sky-100 text-sky-600 ring-1 ring-sky-200",
    amber: isDark
      ? "bg-gradient-to-br from-amber-500/25 to-orange-600/20 text-amber-200 ring-1 ring-amber-400/20"
      : "bg-amber-100 text-amber-600 ring-1 ring-amber-200"
  };
  return tones[tone] || tones.violet;
};

export default function SemestersPage({ externalSearch = "" }) {
  const {
    user,
    theme,
    semesters,
    overallCgpa,
    activeSemester,
    addSemester,
    updateSemester,
    switchSemester,
    deleteSemester,
    bumpDataVersion,
    refreshSemesters,
    pushToast,
    dataVersion
  } = useApp();

  const isDark = theme === "dark";
  const shell = isDark
    ? "rounded-2xl border border-white/[0.07] bg-gradient-to-br from-app-card/95 to-app-surface/80 p-5 shadow-card backdrop-blur-sm"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const input = isDark
    ? "mt-1 w-full rounded-lg border border-white/10 bg-app-surface px-3 py-2 text-sm text-slate-200"
    : "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800";

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    totalCreditHours: "",
    expectedSubjects: "",
    gpa: ""
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const [confirmDeleteSemester, setConfirmDeleteSemester] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    void refreshSemesters();
  }, [user?.id, dataVersion, refreshSemesters]);

  const filtered = useMemo(() => {
    const q = (externalSearch || "").trim().toLowerCase();
    if (!q) return semesters;
    return semesters.filter((s) => s.name.toLowerCase().includes(q));
  }, [semesters, externalSearch]);

  const stats = useMemo(() => {
    const total = semesters.length;
    const completed = semesters.filter((s) => !s.isActive).length;

    const termRows = semesters.map((s) => ({
      id: s.id,
      name: s.name,
      g: termGpaNum(s),
      credits: Number(s.creditsFromSubjects) || 0
    }));
    const withGpa = termRows.filter((r) => r.g != null);
    const cgpa = computeCgpaDisplay(semesters, overallCgpa);
    let cgpaSub = "";
    if (overallCgpa != null && Number.isFinite(overallCgpa)) {
      cgpaSub = "All semesters · graded courses";
    } else if (cgpa !== "—") {
      cgpaSub = "All added terms — credits, or planned hours, or 1/term";
    }

    let bestVal = "—";
    let bestName = "";
    if (withGpa.length) {
      const nums = withGpa.map((r) => r.g);
      const max = Math.max(...nums);
      bestVal = max.toFixed(2);
      const bestRow = withGpa.find((r) => r.g === max);
      bestName = bestRow ? semesters.find((s) => sameId(s.id, bestRow.id))?.name || "" : "";
    }
    return { total, completed, cgpa, cgpaSub, bestVal, bestName };
  }, [semesters, overallCgpa]);


  const openAdd = useCallback(() => {
    setFormError("");
    setForm({ name: "", startDate: "", endDate: "", totalCreditHours: "", expectedSubjects: "", gpa: "" });
    setModal("add");
  }, []);

  const handleExportSemester = useCallback(
    async (sem) => {
      if (!user?.id) {
        pushToast({ title: "Session", message: "Please sign in again.", variant: "error" });
        return;
      }
      const ex = desktopAPI?.semesters?.exportZip;
      if (typeof ex !== "function") {
        pushToast({
          title: "Export",
          message: "Run the app in Electron and restart (npm run dev) if export is not available.",
          variant: "error"
        });
        return;
      }
      setExportingId(sem.id);
      try {
        const res = await ex({ userId: user.id, semesterId: sem.id });
        if (!res?.ok) {
          pushToast({ title: "Export failed", message: res?.error || "Unknown error", variant: "error" });
          return;
        }
        if (res.data?.canceled) return;
        const n = res.data?.filesIncluded ?? 0;
        const si = res.data?.subjectImages ?? 0;
        const msg = `Includes courses, all assignments and quizzes, ${n} file(s)${si ? `, ${si} subject image(s)` : ""} — see manifest.json in the zip.`;
        pushToast({ title: "Semester export saved (ZIP)", message: msg, variant: "success" });
      } catch (e) {
        pushToast({ title: "Export failed", message: e?.message || "Unknown error", variant: "error" });
      } finally {
        setExportingId(null);
      }
    },
    [user?.id, pushToast]
  );

  const openEdit = useCallback(
    (sem) => {
      const row = semesters.find((x) => sameId(x.id, sem.id)) || sem;
      setFormError("");
      setForm({
        name: row.name || "",
        startDate: toDateInput(row.startDate),
        endDate: toDateInput(row.endDate),
        totalCreditHours: row.totalCreditHours != null ? String(row.totalCreditHours) : "",
        expectedSubjects: row.expectedSubjects != null ? String(row.expectedSubjects) : "",
        gpa: row.gpa != null && !Number.isNaN(Number(row.gpa)) ? String(row.gpa) : ""
      });
      setModal(String(row.id));
    },
    [semesters]
  );

  const closeModal = useCallback(() => {
    setModal(null);
    setFormError("");
    setSaving(false);
  }, []);

  const payloadFromForm = () => ({
    name: form.name.trim(),
    startDate: form.startDate?.trim() ? form.startDate.trim() : null,
    endDate: form.endDate?.trim() ? form.endDate.trim() : null,
    gpa: form.gpa === "" || form.gpa == null ? null : form.gpa,
    totalCreditHours: form.totalCreditHours === "" || form.totalCreditHours == null ? null : form.totalCreditHours,
    expectedSubjects: form.expectedSubjects === "" || form.expectedSubjects == null ? null : form.expectedSubjects
  });

  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Enter a semester name.");
      return;
    }
    setFormError("");
    setSaving(true);
    const p = payloadFromForm();
    try {
      if (modal === "add") {
        const ok = await addSemester({ ...p, makeActive: true });
        if (ok) {
          await refreshSemesters();
          bumpDataVersion();
          closeModal();
        }
      } else {
        const id = Number(modal);
        if (Number.isNaN(id)) {
          setFormError("Invalid semester. Close and try again.");
          setSaving(false);
          return;
        }
        const ok = await updateSemester({ id, ...p });
        if (ok) {
          await refreshSemesters();
          bumpDataVersion();
          closeModal();
        }
      }
    } catch (err) {
      const m = err?.message || String(err);
      setFormError(/Desktop API bridge|unavailable/i.test(m) ? "Run the desktop app: npm run dev (Electron)." : m);
      pushToast({ title: "Save failed", message: m, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  async function onConfirmDeleteSemester() {
    if (!confirmDeleteSemester) return;
    const id = confirmDeleteSemester.id;
    setMenuOpenId(null);
    try {
      const ok = await deleteSemester(id);
      if (ok) {
        setDetailId((d) => (d != null && sameId(d, id) ? null : d));
      }
    } catch (e) {
      pushToast({ title: "Delete failed", message: e?.message || "Unknown error", variant: "error" });
    } finally {
      setConfirmDeleteSemester(null);
    }
  }

  const detail = detailId != null ? semesters.find((s) => sameId(s.id, detailId)) : null;
  const detailPlanNum = detail ? termPlanNumber(detail.expectedSubjects) : null;

  return (
    <div className="space-y-4">
      <section
        className={
          isDark
            ? "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-app-card via-app-card to-indigo-950/30 p-6 shadow-card"
            : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        }
      >
        {isDark ? (
          <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
        ) : null}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className={`text-2xl font-bold tracking-tight sm:text-3xl ${
                isDark ? "bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent" : "text-slate-900"
              }`}
            >
              {isDark ? "Semester Management" : "Semesters"}
            </h2>
            <p className={`mt-1.5 max-w-xl text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Track every term, GPA, and credits in one place. Data saves with Electron —{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">npm run dev</code>
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="app-modal-cta group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:via-violet-500 hover:to-violet-500 hover:shadow-indigo-500/40"
          >
            <span className="text-lg font-light leading-none">+</span>
            Add Semester
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Semesters",
            value: stats.total,
            sub: "",
            Icon: IconStatTotal,
            tone: "violet"
          },
          {
            label: "Completed",
            value: stats.completed,
            sub: "Inactive terms",
            Icon: IconStatCheck,
            tone: "emerald"
          },
          {
            label: "CGPA (Overall)",
            value: stats.cgpa,
            sub: stats.cgpaSub,
            Icon: IconStatChart,
            tone: "blue"
          },
          {
            label: "Best GPA",
            value: stats.bestVal,
            sub: stats.bestName || "—",
            Icon: IconStatStar,
            tone: "amber"
          }
        ].map((x) => {
          const Icon = x.Icon;
          return (
            <div
              key={x.label}
              className={
                isDark
                  ? "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-app-card-raised/90 p-4 shadow-card transition hover:border-white/10"
                  : "rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              }
            >
              {isDark ? <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-indigo-500/10 opacity-0 blur-2xl transition group-hover:opacity-100" /> : null}
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{x.label}</p>
                  <p
                    className={`mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {x.value}
                  </p>
                  {x.sub ? <p className="mt-1 truncate text-[11px] text-slate-500">{x.sub}</p> : null}
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${statIconShell(isDark, x.tone)}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className={shell}>
        <h3 className={`text-base font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>All terms</h3>
        <p className="mt-1 text-xs text-slate-500">
          Click the card to set the active term. Counts come from <span className="text-slate-400">Courses</span>; edit a term to set
          GPA and credit hours.
        </p>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No semesters match your search. Add one with the button above.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            {filtered.map((sem, idx) => {
              const active = sameId(activeSemester?.id, sem.id);
              const live = Number(sem.creditsFromSubjects) || 0;
              const stored = sem.totalCreditHours;
              const creditDisplay =
                live > 0 ? `${live} (from courses)` : stored != null ? String(stored) : "0";
              const subj = sem.subjectCount ?? 0;
              const planNum = termPlanNumber(sem.expectedSubjects);
              const hasTermPlan = planNum != null;
              const subjectsMain = hasTermPlan ? planNum : subj;
              const gpaN = (() => {
                const g = sem.gpa;
                if (g == null || g === "") return null;
                const n = Number(g);
                return Number.isNaN(n) ? null : n;
              })();
              const gpaIsFromCourses = gpaN != null && sem.gpaFromSaved === false;
              const borderRing = active
                ? isDark
                  ? "border-emerald-500/50 shadow-[0_0_28px_-8px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/25"
                  : "border-emerald-400/60 ring-1 ring-emerald-300/30 shadow-lg shadow-emerald-500/10"
                : isDark
                  ? inactiveCardAccents[idx % inactiveCardAccents.length]
                  : "border-slate-200/90 shadow-sm ring-1 ring-slate-200/60";

              return (
                <div
                  key={sem.id}
                  className={`relative rounded-2xl border p-5 transition${
                    menuOpenId === sem.id ? " z-40" : ""
                  } ${
                    isDark ? "bg-gradient-to-b from-app-card-raised/95 to-app-card/80 backdrop-blur-sm" : "bg-slate-50"
                  } ${borderRing}`}
                >
                  {isDark && active ? (
                    <div className="pointer-events-none absolute -right-8 -top-8 -z-0 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />
                  ) : null}
                  <button
                    type="button"
                    title={exportingId === sem.id ? "Exporting…" : "Export all data (ZIP)"}
                    disabled={exportingId === sem.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleExportSemester(sem);
                    }}
                    className={
                      isDark
                        ? "app-modal-cta absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-app-card-raised/90 text-lg shadow-sm backdrop-blur-sm transition hover:border-white/25 hover:bg-white/10"
                        : "app-modal-cta absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-lg shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    }
                    aria-label={exportingId === sem.id ? "Exporting" : "Export all data as ZIP"}
                  >
                    {exportingId === sem.id ? "⏳" : "📤"}
                  </button>
                  <div
                    role="button"
                    tabIndex={0}
                    className="relative cursor-pointer"
                    onClick={() => void switchSemester(sem.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        void switchSemester(sem.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 pr-11 sm:pr-12">
                      <div
                        className={
                          active
                            ? isDark
                              ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/35"
                              : "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/80"
                            : isDark
                              ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-500/15 text-slate-400 ring-1 ring-white/10"
                              : "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-500 ring-1 ring-slate-300/50"
                        }
                      >
                        <IconCalendar className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                          {sem.name}
                        </p>
                        <span
                          className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            active
                              ? isDark
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-emerald-100 text-emerald-700"
                              : isDark
                                ? "bg-slate-600/30 text-slate-400"
                                : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {active ? "Active" : "Completed"}
                        </span>
                      </div>
                    </div>
                    <p className={`mt-3 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                      {formatDate(sem.startDate)} — {formatDate(sem.endDate)}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div
                        className={
                          isDark
                            ? "rounded-xl border border-white/[0.06] bg-white/[0.04] p-2.5"
                            : "rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm"
                        }
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Subjects</p>
                        <p className={`mt-1 text-sm font-bold leading-snug ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                          <span className="tabular-nums text-lg leading-none">{subjectsMain}</span>
                          {hasTermPlan && planNum != null ? (
                            subj > 0 ? (
                              <span
                                className={`mt-0.5 block text-[10px] font-medium normal-case ${
                                  isDark ? "text-slate-500" : "text-slate-500"
                                }`}
                              >
                                Courses: {subj}
                              </span>
                            ) : null
                          ) : (
                            <span
                              className={`mt-0.5 block text-[10px] font-medium normal-case ${
                                isDark ? "text-slate-500" : "text-slate-500"
                              }`}
                            >
                              {subj === 1 ? "course" : "courses"} (Courses)
                            </span>
                          )}
                        </p>
                      </div>
                      <div
                        className={
                          isDark
                            ? "rounded-xl border border-white/[0.06] bg-white/[0.04] p-2.5"
                            : "rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm"
                        }
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Credit hours</p>
                        <p className={`mt-1 text-sm font-bold tabular-nums ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                          {creditDisplay}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      {gpaN != null ? (
                        <div>
                          <p
                            className={`text-3xl font-bold tabular-nums ${
                              isDark ? "text-emerald-400" : "text-emerald-600"
                            }`}
                          >
                            {gpaN.toFixed(2)}
                          </p>
                          {gpaLabel(sem.gpa) ? (
                            <p className={`mt-0.5 text-xs font-medium ${isDark ? "text-emerald-400/80" : "text-emerald-600/80"}`}>
                              {gpaLabel(sem.gpa)}
                            </p>
                          ) : null}
                          {gpaIsFromCourses ? (
                            <p className="mt-0.5 text-[10px] text-slate-500">From course grades</p>
                          ) : null}
                        </div>
                      ) : (
                        <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>GPA —</p>
                      )}
                    </div>
                  </div>

                  <div
                    className={`relative z-10 mt-4 flex gap-2 border-t pt-4 ${
                      isDark ? "border-white/[0.08]" : "border-slate-200/90"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailId(sem.id);
                        setMenuOpenId(null);
                      }}
                      className="app-modal-cta flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500"
                    >
                      <IconEye className="h-4 w-4 shrink-0 opacity-90" />
                      View Details
                    </button>
                    <div className={menuOpenId === sem.id ? "relative z-[500]" : "relative"}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId((id) => (id === sem.id ? null : sem.id));
                        }}
                        className={
                          isDark
                            ? "app-modal-cta flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08]"
                            : "app-modal-cta flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
                        }
                        aria-label="More options"
                      >
                        <span className="text-lg leading-none tracking-widest">···</span>
                      </button>
                      {menuOpenId === sem.id ? (
                        <div
                          className={`absolute right-0 top-full z-[600] mt-1 min-w-[10rem] rounded-xl border py-1 shadow-2xl ${
                            isDark ? "border-white/10 bg-app-card" : "border-slate-200 bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-white/5"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(sem);
                              setMenuOpenId(null);
                            }}
                          >
                            Edit semester
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-white/5"
                            onClick={(e) => {
                              e.stopPropagation();
                              void switchSemester(sem.id);
                              setMenuOpenId(null);
                            }}
                          >
                            Set active
                          </button>
                          <div className={`my-1 h-px ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                          <button
                            type="button"
                            className={
                              isDark
                                ? "block w-full px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                                : "block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteSemester(sem);
                              setMenuOpenId(null);
                            }}
                          >
                            Delete term
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modal != null &&
        createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm" onClick={closeModal}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSubmitForm}
            className={
              isDark
                ? "my-4 w-full max-w-md rounded-2xl border border-indigo-500/30 bg-app-card p-5 shadow-card"
                : "my-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
            }
          >
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {modal === "add" ? "Add semester" : "Edit semester"}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="text-xs text-slate-500">
                Name *
                <input className={input} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-500">
                  Start
                  <input type="date" className={input} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                </label>
                <label className="text-xs text-slate-500">
                  End
                  <input type="date" className={input} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-500">
                  Target credit hours
                  <input type="number" min="0" className={input} value={form.totalCreditHours} onChange={(e) => setForm((f) => ({ ...f, totalCreditHours: e.target.value }))} />
                </label>
                <label className="text-xs text-slate-500">
                  Expected subjects
                  <input type="number" min="0" className={input} value={form.expectedSubjects} onChange={(e) => setForm((f) => ({ ...f, expectedSubjects: e.target.value }))} />
                </label>
              </div>
              <label className="text-xs text-slate-500">
                GPA (optional, 0–4)
                <input type="number" min="0" max="4" step="0.01" className={input} value={form.gpa} onChange={(e) => setForm((f) => ({ ...f, gpa: e.target.value }))} />
              </label>
            </div>
            {formError ? <p className="mt-2 text-sm text-rose-500">{formError}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className={isDark ? "rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200" : "rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-800"}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "…" : modal === "add" ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </div>,
        document.body
        )}

      {confirmDeleteSemester
        ? createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={
              isDark
                ? "w-full max-w-sm rounded-2xl border border-rose-500/25 bg-gradient-to-b from-app-surface to-app-card p-4 shadow-card"
                : "w-full max-w-sm rounded-2xl border border-rose-200 bg-white p-4 shadow-lg"
            }
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-semester-title"
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  isDark
                    ? "mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-lg text-rose-300"
                    : "mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-lg text-rose-600"
                }
              >
                🗑
              </div>
              <div>
                <h3
                  id="delete-semester-title"
                  className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Delete semester
                </h3>
                <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Delete <span className={isDark ? "font-semibold text-slate-200" : "font-semibold text-slate-800"}>{confirmDeleteSemester.name}</span> and all
                  its courses, assignments, and files for this term?
                </p>
              </div>
            </div>
            <p
              className={
                isDark
                  ? "mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200"
                  : "mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800"
              }
            >
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSemester(null)}
                className={
                  isDark
                    ? "app-modal-cta rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                    : "app-modal-cta rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                }
              >
                Cancel
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void onConfirmDeleteSemester();
                }}
                className="app-modal-cta rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
        )
        : null}

      {detail &&
        createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8" onClick={() => setDetailId(null)}>
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className={isDark ? "my-4 w-full max-w-md rounded-2xl border border-indigo-500/30 bg-app-card p-5" : "my-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5"}
          >
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{detail.name}</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Start</dt><dd>{formatDate(detail.startDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">End</dt><dd>{formatDate(detail.endDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd>{sameId(activeSemester?.id, detail.id) ? "Active" : "Inactive"}</dd></div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Subjects</dt>
                <dd className="max-w-[14rem] text-right text-sm">
                  {detailPlanNum != null ? (
                    <>
                      <span className={isDark ? "font-semibold text-slate-200" : "font-semibold text-slate-900"}>
                        {detailPlanNum}
                      </span>{" "}
                      <span className="text-slate-500">(Add/Edit term)</span>
                      {Number(detail.subjectCount) > 0 ? (
                        <span className="mt-0.5 block text-xs text-slate-500">Courses: {detail.subjectCount}</span>
                      ) : null}
                    </>
                  ) : (
                    <>{detail.subjectCount ?? 0} (Courses page)</>
                  )}
                </dd>
              </div>
              <div className="flex justify-between"><dt className="text-slate-500">Credits</dt><dd>{Number(detail.creditsFromSubjects) || 0} from courses · {detail.totalCreditHours != null ? detail.totalCreditHours : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">GPA</dt><dd>{detail.gpa != null && !Number.isNaN(Number(detail.gpa)) ? Number(detail.gpa).toFixed(2) : "—"}</dd></div>
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setDetailId(null); openEdit(detail); }} className="rounded-lg border border-white/15 px-3 py-2 text-sm">
                Edit
              </button>
              <button type="button" onClick={() => setDetailId(null)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
        )
      }
    </div>
  );
}
