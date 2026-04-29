import React, { useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";

const inputClass =
  "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500 sm:w-auto";
const labelClass = "mb-1 block text-sm font-medium text-gray-300";

const today = new Date().toISOString().slice(0, 10);

export default function AssignmentsPage({
  initialSubjectId,
  onClearInitialSubject,
  externalSearch = "",
  listOnly = false,
  forcedType = null
}) {
  const { activeSemester, bumpDataVersion, pushToast } = useApp();
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState(forcedType || (listOnly ? "assignment" : "all"));
  const [form, setForm] = useState({
    subjectId: "",
    title: "",
    type: "assignment",
    dueDate: today,
    reminderAt: "",
    details: "",
    status: "pending"
  });

  useEffect(() => {
    if (!activeSemester) return;
    loadData();
  }, [activeSemester]);

  useEffect(() => {
    if (!initialSubjectId) return;
    setForm((prev) => ({ ...prev, subjectId: String(initialSubjectId) }));
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    onClearInitialSubject?.();
  }, [initialSubjectId, onClearInitialSubject]);

  useEffect(() => {
    if (listOnly) {
      setTypeFilter("assignment");
      return;
    }
    if (forcedType) {
      setTypeFilter(forcedType);
      return;
    }
    setTypeFilter("all");
  }, [listOnly, forcedType]);

  async function loadData() {
    setError("");
    const [subjectsRes, assignmentsRes] = await Promise.all([
      desktopAPI.subjects.list(activeSemester.id),
      desktopAPI.assignments.listBySemester(activeSemester.id)
    ]);

    if (!subjectsRes.ok) return setError(subjectsRes.error || "Failed to load courses.");
    if (!assignmentsRes.ok) return setError(assignmentsRes.error || "Failed to load assignments.");

    setSubjects(subjectsRes.data);
    setAssignments(assignmentsRes.data);

    if (subjectsRes.data.length > 0 && !form.subjectId) {
      setForm((prev) => ({ ...prev, subjectId: String(subjectsRes.data[0].id) }));
    }
  }

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm((prev) => ({
      subjectId: subjects[0] ? String(subjects[0].id) : "",
      title: "",
      type: "assignment",
      dueDate: today,
      reminderAt: "",
      details: "",
      status: "pending"
    }));
  }

  async function submitAssignment(event) {
    event.preventDefault();
    setError("");
    if (!activeSemester) return;

    if (!form.subjectId || !form.title.trim() || !form.dueDate) {
      return setError("Subject, title, and due date are required.");
    }

    const payload = {
      id: editingId,
      semesterId: activeSemester.id,
      subjectId: Number(form.subjectId),
      title: form.title.trim(),
      type: form.type,
      dueDate: form.dueDate,
      reminderAt: form.reminderAt || null,
      details: form.details.trim() || null,
      status: form.status,
      marks: null
    };

    const res = await desktopAPI.assignments.save(payload);
    if (!res.ok) return setError(res.error || "Failed to save assignment.");
    setAssignments(res.data);
    bumpDataVersion();
    pushToast({
      title: "Successful",
      message: editingId ? `${itemLabel} updated successfully.` : `${itemLabel} added successfully.`,
      variant: "success"
    });
    if (payload.status === "pending" && payload.reminderAt) {
      const selectedSubject = subjects.find((subject) => subject.id === payload.subjectId);
      const reminderText = `${payload.type.toUpperCase()} "${payload.title}" (${selectedSubject?.name || "Subject"}) due ${payload.dueDate} | reminder ${payload.reminderAt}`;
      pushToast({
        title: "Reminder scheduled",
        message: `${reminderText}. Alerts at 1h and 2h before this time (app open).`,
        variant: "info"
      });
    }
    resetForm();
  }

  function startEdit(item) {
    setShowForm(true);
    setEditingId(item.id);
    setForm({
      subjectId: String(item.subjectId),
      title: item.title,
      type: item.type,
      dueDate: item.dueDate?.slice(0, 10) || today,
      reminderAt: item.reminderAt ? item.reminderAt.slice(0, 16) : "",
      details: item.details || "",
      status: item.status
    });
  }

  async function deleteAssignment(id) {
    if (!activeSemester) return;
    const res = await desktopAPI.assignments.remove({ assignmentId: id, semesterId: activeSemester.id });
    if (!res.ok) return setError(res.error || "Failed to delete assignment.");
    setAssignments(res.data);
    bumpDataVersion();
    pushToast({ title: "Successful", message: "Item deleted successfully.", variant: "success" });
    if (editingId === id) resetForm();
  }

  async function updateStatus(item, nextStatus) {
    if (!activeSemester) return;
    const payload = {
      id: item.id,
      semesterId: activeSemester.id,
      subjectId: Number(item.subjectId),
      title: item.title,
      type: item.type,
      dueDate: item.dueDate,
      reminderAt: item.reminderAt || null,
      details: item.details || null,
      status: nextStatus,
      marks: null
    };
    const res = await desktopAPI.assignments.save(payload);
    if (!res.ok) return setError(res.error || "Failed to update status.");
    setAssignments(res.data);
    bumpDataVersion();
    pushToast({ title: "Successful", message: `Status changed to ${nextStatus}.`, variant: "success" });
  }

  const upcoming = assignments
    .filter((item) => item.status === "pending")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const effectiveSearch = (search || externalSearch).toLowerCase();
  const filteredAssignments = assignments.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(effectiveSearch) ||
      item.subjectName.toLowerCase().includes(effectiveSearch) ||
      (item.details || "").toLowerCase().includes(effectiveSearch);
    const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
    const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  const itemLabel = form.type === "quiz" ? "Quiz" : "Assignment";
  const pageTitle = listOnly ? "Assignments" : forcedType === "quiz" ? "Quizzes" : "Assignments & Quiz";
  const statusSummary = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter((item) => item.status === "pending").length;
    const completed = assignments.filter((item) => item.status === "completed").length;
    const overdue = assignments.filter((item) => {
      if (item.status !== "pending") return false;
      const due = parseISO(item.dueDate);
      return isValid(due) && differenceInCalendarDays(due, new Date()) < 0;
    }).length;
    return { total, pending, completed, overdue };
  }, [assignments]);

  if (!activeSemester) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center text-gray-400">
        Select or create a semester first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/[0.06] bg-app-card p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">📋 {pageTitle}</h2>
            <p className="mt-1 text-xs text-slate-400">Create, manage and track assignments & quizzes with ease.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-app-surface px-3 py-2 lg:w-72">
              <span className="text-xs text-slate-500">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignments..."
                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
            {!listOnly ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500"
              >
                + Add Assignment / Quiz
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {!listOnly ? (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-indigo-500/20 to-indigo-900/20 p-4">
            <p className="text-xs text-slate-400">📦 Total Assignments</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{statusSummary.total}</h3>
            <p className="mt-1 text-xs text-slate-500">All time</p>
          </article>
          <article className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-amber-500/20 to-amber-900/20 p-4">
            <p className="text-xs text-slate-400">🟡 Pending</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{statusSummary.pending}</h3>
            <p className="mt-1 text-xs text-slate-500">Need attention</p>
          </article>
          <article className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 p-4">
            <p className="text-xs text-slate-400">🟢 Completed</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{statusSummary.completed}</h3>
            <p className="mt-1 text-xs text-slate-500">Well done!</p>
          </article>
          <article className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-rose-500/20 to-rose-900/20 p-4">
            <p className="text-xs text-slate-400">🔴 Overdue</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{statusSummary.overdue}</h3>
            <p className="mt-1 text-xs text-slate-500">Late submissions</p>
          </article>
        </section>
      ) : null}

      {showForm && !listOnly ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/95 p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Assignments & Quiz Form</h2>
                <p className="mt-1 text-sm text-gray-400">Add or update an item, then it will return to this list page.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md bg-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-600"
              >
                Close ✕
              </button>
            </div>

            {subjects.length === 0 ? (
              <p className="mt-4 text-sm text-amber-300">Add at least one course before creating assignments.</p>
            ) : (
              <form onSubmit={submitAssignment} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Type</label>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Course</label>
              <select
                className={inputClass}
                value={form.subjectId}
                onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                required
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>{itemLabel} Title</label>
              <input
                className={inputClass}
                placeholder={`${itemLabel} title`}
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Due Date</label>
              <input
                className={inputClass}
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Reminder Set</label>
              <input
                className={inputClass}
                type="datetime-local"
                value={form.reminderAt}
                onChange={(e) => setForm((prev) => ({ ...prev, reminderAt: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-2 flex flex-col gap-1">
              <label className={labelClass}>{itemLabel} Details</label>
              <textarea
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500"
                rows={2}
                placeholder={`Details / notes about this ${form.type}...`}
                value={form.details}
                onChange={(e) => setForm((prev) => ({ ...prev, details: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 xl:col-span-1 flex items-end justify-start gap-2 xl:justify-end">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-100 hover:bg-gray-600"
                >
                  Cancel
                </button>
              ) : null}
              <button className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500">
                {editingId ? `Update ${itemLabel}` : `Add ${itemLabel}`}
              </button>
            </div>
              </form>
            )}
            {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
          </section>
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-300">All Assignments & Quizzes</h3>
          <div className="flex flex-wrap gap-2">
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          {listOnly || forcedType ? null : (
            <select className={inputClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
            </select>
          )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="text-gray-400">
              <tr>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Course</th>
                <th className="px-2 py-2">Due Date</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-2 py-3 text-gray-500">
                    No matching assignments or quizzes found.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((item) => {
                  const parsedDate = parseISO(item.dueDate);
                  const dueIn = isValid(parsedDate) ? differenceInCalendarDays(parsedDate, new Date()) : null;
                  const reminderParsed = item.reminderAt ? parseISO(item.reminderAt) : null;
                  const reminderOk = reminderParsed && isValid(reminderParsed);
                  return (
                    <tr key={item.id} className="border-t border-gray-800 text-gray-200">
                      <td className="px-2 py-2">
                        <p className="font-medium">{item.title}</p>
                        {item.details ? <p className="text-xs text-slate-500">{item.details}</p> : null}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            item.type === "quiz" ? "bg-cyan-500/20 text-cyan-300" : "bg-indigo-500/20 text-indigo-300"
                          }`}
                        >
                          {item.type === "quiz" ? "Quiz" : "Assignment"}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-semibold text-purple-300">
                            {(item.subjectName || "C").slice(0, 2).toUpperCase()}
                          </span>
                          <span>{item.subjectName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <p>{isValid(parsedDate) ? format(parsedDate, "dd MMM, yyyy") : item.dueDate}</p>
                        {dueIn != null ? (
                          <p className={`text-xs ${dueIn < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                            {dueIn < 0 ? "Overdue" : dueIn === 0 ? "Due today" : `${dueIn} day(s) left`}
                          </p>
                        ) : null}
                        {reminderOk ? (
                          <p className="text-xs text-indigo-300">🔔 Reminder {format(reminderParsed, "dd MMM, HH:mm")}</p>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={item.status}
                          onChange={(e) => updateStatus(item, e.target.value)}
                          className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs capitalize text-gray-200 outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() =>
                              pushToast({
                                title: item.title,
                                message: item.details || "No additional details.",
                                variant: "info"
                              })
                            }
                            className="rounded bg-gray-700/70 px-2 py-1 text-xs text-gray-200 hover:bg-gray-600"
                          >
                            👁
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            className="rounded bg-indigo-600/20 px-2 py-1 text-xs text-indigo-300 hover:bg-indigo-600/30"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteAssignment(item.id)}
                            className="rounded bg-rose-600/20 px-2 py-1 text-xs text-rose-300 hover:bg-rose-600/30"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!listOnly ? (
        <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">Upcoming Deadlines</h3>
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">No pending upcoming deadlines.</p>
            ) : (
              upcoming.map((item) => (
                <article key={item.id} className="flex items-center justify-between rounded-lg bg-gray-800/70 p-3">
                  <div>
                    <p className="text-sm text-white">{item.title}</p>
                    <p className="text-xs text-gray-400">
                      {item.subjectName} - {format(parseISO(item.dueDate), "dd MMM yyyy")}
                    </p>
                    {item.details ? <p className="mt-1 text-xs text-gray-500">{item.details}</p> : null}
                  </div>
                  <span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-300 capitalize">{item.type}</span>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

    </div>
  );
}
