import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";

const modalInputClass =
  "w-full rounded-lg border border-slate-700/80 bg-[#0b1733] px-2.5 py-1.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400/70 focus:ring-1 focus:ring-indigo-500/20";
const modalLabelClass = "mb-1 block text-xs font-semibold text-slate-200";

export default function SubjectsPage({ onManageSubject, onViewCourseFiles, onViewDetails, externalSearch = "" }) {
  const { activeSemester, bumpDataVersion, pushToast, dataVersion, theme } = useApp();
  const isDark = theme === "dark";
  const sectionShell = isDark
    ? "rounded-2xl border border-white/[0.06] bg-app-card p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const searchInputClass = isDark
    ? "rounded-lg border border-white/10 bg-app-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
    : "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200";
  const [subjects, setSubjects] = useState([]);
  const [fileCountBySubject, setFileCountBySubject] = useState({});
  const [assignmentCountBySubject, setAssignmentCountBySubject] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [imagePreviewMap, setImagePreviewMap] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [creditHours, setCreditHours] = useState("");
  const [gradePoint, setGradePoint] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [confirmDeleteSubject, setConfirmDeleteSubject] = useState(null);

  useEffect(() => {
    if (!activeSemester) return;
    loadSubjects();
  }, [activeSemester]);

  useEffect(() => {
    if (!activeSemester) return;
    let cancelled = false;
    (async function loadCounts() {
      const [filesRes, assignmentsRes] = await Promise.all([
        desktopAPI.files.list(activeSemester.id),
        desktopAPI.assignments.listBySemester(activeSemester.id)
      ]);
      if (cancelled) return;
      if (filesRes.ok) {
        const nextFiles = {};
        for (const f of filesRes.data || []) {
          if (f.subjectId == null) continue;
          const id = f.subjectId;
          nextFiles[id] = (nextFiles[id] || 0) + 1;
        }
        setFileCountBySubject(nextFiles);
      }
      if (assignmentsRes.ok) {
        const nextAssignments = {};
        for (const a of assignmentsRes.data || []) {
          if (a.subjectId == null) continue;
          const id = a.subjectId;
          nextAssignments[id] = (nextAssignments[id] || 0) + 1;
        }
        setAssignmentCountBySubject(nextAssignments);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSemester, dataVersion]);

  async function loadSubjects() {
    const res = await desktopAPI.subjects.list(activeSemester.id);
    if (!res.ok) return setError(res.error || "Failed to load courses.");
    setSubjects(res.data);
  }

  useEffect(() => {
    let cancelled = false;
    async function hydrateImages() {
      const nextMap = {};
      for (const subject of subjects) {
        if (!subject.imagePath) continue;
        const imageRes = await desktopAPI.files.asDataUrl(subject.imagePath);
        if (imageRes.ok && imageRes.data) {
          nextMap[subject.id] = imageRes.data;
        }
      }
      if (!cancelled) setImagePreviewMap(nextMap);
    }
    hydrateImages();
    return () => {
      cancelled = true;
    };
  }, [subjects]);

  function resetForm() {
    setName("");
    setProfessorName("");
    setImagePath("");
    setCreditHours("");
    setGradePoint("");
    setEditingId(null);
    setFormOpen(false);
  }

  async function submitSubject(event) {
    event.preventDefault();
    setError("");
    if (!activeSemester) return;

    const hours = Number(creditHours);
    if (!name.trim() || Number.isNaN(hours) || hours <= 0) {
      return setError("Please enter a valid subject name and credit hours.");
    }

    let gp = null;
    const gTrim = String(gradePoint).trim();
    if (gTrim !== "") {
      const n = parseFloat(gTrim);
      if (Number.isNaN(n) || n < 0 || n > 4) {
        return setError("GPA (grade point) must be between 0.00 and 4.00, or leave empty.");
      }
      gp = Math.round(n * 100) / 100;
    }

    const payload = {
      id: editingId,
      semesterId: Number(activeSemester.id),
      name: name.trim(),
      professorName: professorName.trim() || null,
      imagePath: imagePath || null,
      creditHours: hours,
      gradePoint: gp
    };

    const res = await desktopAPI.subjects.save(payload);
    if (!res.ok) return setError(res.error || "Failed to save subject.");
    setSubjects(res.data);
    bumpDataVersion();
    pushToast({
      title: "Successful",
      message: editingId ? "Course updated successfully." : "Course added successfully.",
      variant: "success"
    });
    resetForm();
  }

  function startEdit(subject) {
    setMenuOpenId(null);
    setFormOpen(true);
    setEditingId(subject.id);
    setName(subject.name);
    setProfessorName(subject.professorName || "");
    setImagePath(subject.imagePath || "");
    setCreditHours(String(subject.creditHours));
    setGradePoint(
      subject.gradePoint != null && subject.gradePoint !== "" && !Number.isNaN(Number(subject.gradePoint))
        ? String(Number(subject.gradePoint))
        : ""
    );
    setError("");
  }

  async function pickImage() {
    const res = await desktopAPI.files.pick();
    if (!res.ok || !res.data?.length) return;
    const pickedPath = res.data[0];
    const isLikelyImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(pickedPath);
    if (!isLikelyImage) {
      setError("Please select a valid image file (png, jpg, jpeg, webp, gif, bmp, svg).");
      return;
    }
    setError("");
    setImagePath(pickedPath);
    pushToast({ title: "Successful", message: "Image selected successfully.", variant: "success" });
  }

  async function deleteSubject(subjectId) {
    if (!activeSemester) return;
    setConfirmDeleteSubject(null);
    setMenuOpenId(null);
    const res = await desktopAPI.subjects.remove({ subjectId, semesterId: Number(activeSemester.id) });
    if (!res.ok) return setError(res.error || "Failed to delete subject.");
    setSubjects(res.data);
    bumpDataVersion();
    pushToast({ title: "Successful", message: "Course deleted successfully.", variant: "success" });
    if (editingId === subjectId) resetForm();
  }

  if (!activeSemester) {
    return (
      <div
        className={`rounded-2xl border border-dashed p-8 text-center ${
          isDark ? "border-white/10 bg-app-card/50 text-slate-500" : "border-slate-300 bg-slate-50 text-slate-500"
        }`}
      >
        Select or create a semester first.
      </div>
    );
  }

  const effectiveSearch = (search || externalSearch).toLowerCase();
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(effectiveSearch) ||
      (subject.professorName || "").toLowerCase().includes(effectiveSearch)
  );

  return (
    <div className="space-y-4">
      <section className={sectionShell}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>📘 Courses</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your courses and access all course related content.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-app-surface px-3 py-2 lg:w-72">
              <span className="text-xs text-slate-500">⌕</span>
              <input
                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500"
            >
              + Add Course
            </button>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
      </section>

      <section className={sectionShell}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Courses</h3>
          <span className="rounded bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200">
            {activeSemester.name}
          </span>
        </div>
        <div className="pb-1">
          {filteredSubjects.length === 0 ? (
            <div
              className={`rounded-xl border p-4 text-sm ${
                isDark ? "border-white/10 bg-app-surface/80 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              No matching courses found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <article
                key={subject.id}
                className={
                  isDark
                    ? "rounded-2xl border border-indigo-500/25 bg-app-card/90 bg-gradient-to-br from-app-card/95 to-app-card-raised/90 p-3 shadow-card transition hover:-translate-y-0.5 hover:border-indigo-400/45"
                    : "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200"
                }
              >
                <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
                  {subject.gradePoint != null &&
                  subject.gradePoint !== "" &&
                  !Number.isNaN(Number(subject.gradePoint)) ? (
                    <span
                      className={
                        isDark
                          ? "rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-500/30"
                          : "rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80"
                      }
                    >
                      GPA {Number(subject.gradePoint).toFixed(2)}
                    </span>
                  ) : null}
                  <span
                    className={
                      isDark
                        ? "rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-200"
                        : "rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900"
                    }
                  >
                    {subject.creditHours} Credits
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {imagePreviewMap[subject.id] && !failedImages[subject.id] ? (
                    <img
                      src={imagePreviewMap[subject.id]}
                      alt={subject.name}
                      className="h-12 w-12 rounded-xl object-cover"
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [subject.id]: true }));
                      }}
                    />
                  ) : (
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold ${
                        isDark ? "bg-indigo-500/20 text-indigo-200" : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {subject.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className={`text-[18px] font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{subject.name}</h4>
                    <p className="min-h-[30px] text-[11px] text-slate-500">
                      {subject.professorName
                        ? `Study with ${subject.professorName}.`
                        : "Study of course concepts, tasks, and practical work."}
                    </p>
                  </div>
                </div>
                <div className={`mt-3 flex items-center justify-between text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  <span>📝 {(assignmentCountBySubject[subject.id] || 0) + " Assignments"}</span>
                  <span className={isDark ? "text-indigo-200/80" : "text-indigo-600"}>
                    📂 {fileCountBySubject[subject.id] ? `${fileCountBySubject[subject.id]} files` : "0 files"}
                  </span>
                </div>
                <div
                  className={`mt-3 border-t pt-2.5 ${
                    isDark ? "border-indigo-500/20" : "border-slate-200/90"
                  }`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onViewDetails?.(subject)}
                    className={
                      isDark
                        ? "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/30 outline-none transition duration-200 will-change-transform ease-out hover:scale-[1.03] hover:shadow-lg hover:shadow-indigo-500/50 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                        : "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 outline-none transition duration-200 will-change-transform ease-out hover:scale-[1.03] hover:shadow-lg hover:shadow-indigo-500/40 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                    }
                  >
                    View Details
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpenId((prev) => (prev === subject.id ? null : subject.id))}
                      className={
                        (isDark
                          ? "inline-flex w-full min-h-[40px] items-center justify-center rounded-xl border border-amber-500/35 bg-gradient-to-b from-slate-800/90 to-slate-950/95 px-2 text-lg font-bold leading-none text-amber-200/95 shadow-sm shadow-amber-500/5 outline-none transition duration-200 will-change-transform ease-out hover:scale-[1.06] hover:border-amber-400/60 hover:bg-gradient-to-b hover:from-amber-500/20 hover:to-amber-600/10 hover:shadow-md hover:shadow-amber-500/25 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400/50"
                          : "inline-flex w-full min-h-[40px] items-center justify-center rounded-xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white px-2 text-lg font-bold text-amber-800 shadow-sm outline-none transition duration-200 will-change-transform ease-out hover:scale-[1.06] hover:border-amber-400 hover:shadow-md hover:shadow-amber-200/60 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-300") +
                        (menuOpenId === subject.id ? (isDark ? " ring-2 ring-amber-400/80" : " ring-2 ring-amber-500/90") : "")
                      }
                    >
                      ⋯
                    </button>
                    {menuOpenId === subject.id ? (
                      <div className="absolute right-0 top-full z-20 mt-1.5 w-28 rounded-lg border border-white/10 bg-app-surface p-1 shadow-card">
                        <button
                          type="button"
                          onClick={() => startEdit(subject)}
                          className="w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-200 transition hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteSubject(subject);
                            setMenuOpenId(null);
                          }}
                          className="w-full rounded-md px-2 py-1.5 text-left text-xs text-rose-300 transition hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                  </div>
                </div>
              </article>
            ))}
            </div>
          )}
        </div>
        <div className="mt-3 text-xs text-slate-500">Total {filteredSubjects.length} courses</div>
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
          <form
            onSubmit={submitSubject}
            className="w-full max-w-md rounded-xl border border-indigo-500/20 bg-gradient-to-b from-app-surface to-app-card p-0 shadow-card"
          >
            <div className="border-b border-slate-700/70 px-3 py-2.5">
              <div className="border-l-2 border-indigo-500 pl-2.5">
                <h3 className="text-base font-semibold text-white">{editingId ? "Edit Course" : "Add Course"}</h3>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">Course details; link with assignments and quizzes.</p>
              </div>
            </div>

            <div className="space-y-2 p-3">
              <div>
                <label className={modalLabelClass}>Course Name</label>
                <input className={modalInputClass} placeholder="Course name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className={modalLabelClass}>Professor Name</label>
                <input className={modalInputClass} placeholder="Professor name" value={professorName} onChange={(e) => setProfessorName(e.target.value)} />
              </div>
                <div>
                <label className={modalLabelClass}>Credit Hours</label>
                <input
                  className={modalInputClass}
                  type="number"
                  min="1"
                  max="6"
                  placeholder="e.g. 3"
                  value={creditHours}
                  onChange={(e) => setCreditHours(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={modalLabelClass}>
                  Course GPA (optional) <span className="font-normal text-slate-500">0.00 – 4.00</span>
                </label>
                <input
                  className={modalInputClass}
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="e.g. 3.5"
                  value={gradePoint}
                  onChange={(e) => setGradePoint(e.target.value)}
                />
              </div>
            </div>

            <div className="px-3 pb-1">
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">Course image</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={pickImage}
                    className="shrink-0 rounded-md bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-600"
                >
                  Add picture
                </button>
                <p className="min-w-0 flex-1 truncate text-xs text-slate-300">{imagePath ? imagePath : "No image selected"}</p>
              </div>
            </div>
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-slate-700/70 px-3 py-2.5">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-600 bg-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-600"
              >
                Cancel
              </button>
                <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-indigo-500">
                {editingId ? "Update Course" : "Save Course"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {confirmDeleteSubject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/25 bg-gradient-to-b from-app-surface to-app-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-lg text-rose-300">🗑</div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Course</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Are you sure you want to delete <span className="font-semibold text-slate-200">{confirmDeleteSubject.name}</span>?
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSubject(null)}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteSubject(confirmDeleteSubject.id)}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
