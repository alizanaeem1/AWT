import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function normalizeFsPath(p) {
  if (!p) return "";
  return String(p).replace(/\//g, "\\");
}

function fileTypeBadge(fileName) {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  const map = {
    pdf: { emoji: "📕", bg: "bg-rose-500/20", text: "text-rose-200" },
    doc: { emoji: "📘", bg: "bg-blue-500/20", text: "text-blue-200" },
    docx: { emoji: "📘", bg: "bg-blue-500/20", text: "text-blue-200" },
    md: { emoji: "📝", bg: "bg-violet-500/20", text: "text-violet-200" },
    txt: { emoji: "📄", bg: "bg-slate-500/20", text: "text-slate-200" },
    xls: { emoji: "📗", bg: "bg-emerald-500/20", text: "text-emerald-200" },
    xlsx: { emoji: "📗", bg: "bg-emerald-500/20", text: "text-emerald-200" },
    ppt: { emoji: "📙", bg: "bg-orange-500/20", text: "text-orange-200" },
    pptx: { emoji: "📙", bg: "bg-orange-500/20", text: "text-orange-200" },
    jpg: { emoji: "🖼", bg: "bg-cyan-500/20", text: "text-cyan-200" },
    jpeg: { emoji: "🖼", bg: "bg-cyan-500/20", text: "text-cyan-200" },
    png: { emoji: "🖼", bg: "bg-cyan-500/20", text: "text-cyan-200" },
    zip: { emoji: "🗜", bg: "bg-amber-500/20", text: "text-amber-200" }
  };
  const c = map[ext] || { emoji: "📎", bg: "bg-indigo-500/20", text: "text-indigo-200" };
  return c;
}

export default function FilesPage({ externalSearch = "", filterSubjectId = null, onClearFileSubjectFilter }) {
  const { activeSemester, bumpDataVersion, pushToast, theme } = useApp();
  const isDark = theme === "dark";
  const [files, setFiles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [pendingPaths, setPendingPaths] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const sectionShell = isDark
    ? "rounded-2xl border border-white/[0.06] bg-app-card p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  useEffect(() => {
    if (!activeSemester) return;
    loadFiles();
    loadSubjects();
  }, [activeSemester]);

  useEffect(() => {
    if (!subjects.length) {
      setSelectedSubjectId("");
      return;
    }
    if (filterSubjectId != null) {
      const hasFilter = subjects.some((s) => Number(s.id) === Number(filterSubjectId));
      if (hasFilter) {
        setSelectedSubjectId(String(filterSubjectId));
        return;
      }
    }
    const hasSelected = subjects.some((subject) => String(subject.id) === String(selectedSubjectId));
    if (!hasSelected) {
      setSelectedSubjectId(String(subjects[0].id));
    }
  }, [subjects, selectedSubjectId, filterSubjectId]);

  async function loadFiles() {
    const res = await desktopAPI.files.list(activeSemester.id);
    if (!res.ok) return setError(res.error || "Failed to load files.");
    setFiles(res.data);
  }

  async function loadSubjects() {
    const res = await desktopAPI.subjects.list(activeSemester.id);
    if (!res.ok) return setSubjects([]);
    setSubjects(res.data);
  }

  async function uploadFiles() {
    if (!activeSemester) return;
    setError("");
    try {
      const picked = await desktopAPI.files.pick();
      if (!picked.ok) throw new Error(picked.error || "Failed to pick files.");
      if (!subjects.length) throw new Error("Please add a course first.");
      setPendingPaths(picked.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadFromPaths(paths, subjectId) {
    if (!activeSemester || !paths?.length) return;
    const parsedSubjectId = Number(subjectId);
    if (!Number.isInteger(parsedSubjectId) || parsedSubjectId <= 0) {
      setError("Please select a valid course.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      for (const sourcePath of paths) {
        const saveRes = await desktopAPI.files.add({
          semesterId: activeSemester.id,
          sourcePath,
          subjectId: parsedSubjectId
        });
        if (!saveRes.ok) throw new Error(saveRes.error || "Failed to upload file.");
        setFiles(saveRes.data);
        bumpDataVersion();
      }
      pushToast({ title: "Successful", message: "File(s) uploaded successfully.", variant: "success" });
      setPendingPaths([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(fileId) {
    if (!activeSemester) return;
    const res = await desktopAPI.files.remove({ fileId, semesterId: activeSemester.id });
    if (!res.ok) return setError(res.error || "Failed to remove file.");
    setFiles(res.data);
    bumpDataVersion();
    pushToast({ title: "Successful", message: "File deleted successfully.", variant: "success" });
  }

  async function openFile(filePath) {
    const res = await desktopAPI.files.open(filePath);
    if (!res.ok) setError(res.error || "Unable to open file.");
    else pushToast({ title: "Successful", message: "File opened successfully.", variant: "success" });
  }

  async function revealFile(filePath) {
    const res = await desktopAPI.files.reveal(filePath);
    if (!res.ok) setError(res.error || "Unable to reveal file.");
    else pushToast({ title: "Successful", message: "File location opened successfully.", variant: "success" });
  }

  function onDragOver(event) {
    event.preventDefault();
    setDragActive(true);
  }

  function onDragLeave(event) {
    event.preventDefault();
    setDragActive(false);
  }

  async function onDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const droppedPaths = Array.from(event.dataTransfer?.files || [])
      .map((file) => file.path)
      .filter(Boolean);
    if (!subjects.length) {
      setError("Please add a course first.");
      return;
    }
    setPendingPaths(droppedPaths);
  }

  const effectiveSearch = (search || externalSearch).toLowerCase();
  const nameForFilterCourse =
    filterSubjectId != null ? subjects.find((s) => Number(s.id) === Number(filterSubjectId))?.name : null;
  const filteredFiles = files
    .filter((file) => {
      if (filterSubjectId == null) return true;
      return file.subjectId != null && Number(file.subjectId) === Number(filterSubjectId);
    })
    .filter((file) => {
      const at = String(file.assignmentTitle || "").toLowerCase();
      return (
        file.fileName.toLowerCase().includes(effectiveSearch) ||
        file.filePath.toLowerCase().includes(effectiveSearch) ||
        (file.subjectName || "").toLowerCase().includes(effectiveSearch) ||
        at.includes(effectiveSearch)
      );
    });

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

  return (
    <div className="space-y-4 pb-8">
      <section
        className={`${sectionShell} relative overflow-hidden transition-all ${
          dragActive ? (isDark ? "border-indigo-500/50 ring-2 ring-indigo-500/20" : "border-indigo-300 ring-2 ring-indigo-200") : ""
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr,280px] lg:items-center">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>File Management System</h2>
            <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Upload, store, and link course materials in one place — including files attached from assignments /
              quizzes. Drag files here or use Upload; pick a course when prompted.
            </p>

            {filterSubjectId != null && nameForFilterCourse ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-200 ring-1 ring-indigo-500/30">
                  Showing: <span className="font-semibold">{nameForFilterCourse}</span> only
                </span>
                {onClearFileSubjectFilter ? (
                  <button
                    type="button"
                    onClick={onClearFileSubjectFilter}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      isDark
                        ? "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                        : "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    Show all courses
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={uploadFiles}
                disabled={uploading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <span className="text-base">⬆</span>
                {uploading ? "Uploading…" : "Upload Files"}
              </button>
              <div
                className={`flex w-full flex-1 items-center gap-2 rounded-xl border px-3 py-2 sm:max-w-sm ${
                  isDark ? "border-white/10 bg-app-surface" : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="text-slate-500">⌕</span>
                <input
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full bg-transparent text-sm outline-none ${
                    isDark ? "text-slate-200 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>
            {error ? <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
            {dragActive ? <p className="mt-3 text-xs text-indigo-300">Drop files to upload</p> : null}
          </div>

          <div className="hidden lg:block">
            <div className="relative mx-auto flex h-44 w-full max-w-[280px] items-center justify-center rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/15 via-app-surface to-fuchsia-500/10 p-4 shadow-inner">
              <div className="text-5xl">📁</div>
              <div className="absolute right-3 top-3 rounded-lg bg-app-card/80 px-2 py-1 text-lg shadow-lg ring-1 ring-white/10">⬆</div>
              <div className="absolute bottom-3 left-3 flex gap-1.5 text-xl opacity-80">
                <span>📄</span>
                <span>📃</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionShell}>
        <h3 className={`mb-4 text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
          Stored files — {activeSemester.name}
          {filterSubjectId != null && nameForFilterCourse ? ` — ${nameForFilterCourse}` : ""}
        </h3>
        <div className="w-full max-w-full overflow-x-hidden">
          <table className="w-full min-w-0 table-fixed text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th
                  className={`w-[20%] border-b px-3 py-2.5 sm:pl-1 ${isDark ? "border-white/10" : "border-slate-200"}`}
                >
                  Name
                </th>
                <th className={`w-[14%] border-b px-3 py-2.5 ${isDark ? "border-white/10" : "border-slate-200"}`}>
                  Course / link
                </th>
                <th className={`w-[8%] border-b px-3 py-2.5 ${isDark ? "border-white/10" : "border-slate-200"}`}>
                  Size
                </th>
                <th className={`w-[28%] border-b px-3 py-2.5 ${isDark ? "border-white/10" : "border-slate-200"}`}>
                  Saved path
                </th>
                <th className={`w-[12%] border-b px-3 py-2.5 ${isDark ? "border-white/10" : "border-slate-200"}`}>
                  Uploaded
                </th>
                <th
                  className={`w-[18%] border-b px-3 py-2.5 text-right sm:pr-1 ${
                    isDark ? "border-white/10" : "border-slate-200"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`px-3 py-8 text-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    {filterSubjectId != null
                      ? "No files for this course yet. Use Upload — the course is pre-selected for you."
                      : "No matching files found."}
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const kind = fileTypeBadge(file.fileName);
                  return (
                    <tr
                      key={file.id}
                      className={isDark ? "border-b border-white/[0.06] text-slate-200" : "border-b border-slate-100 text-slate-800"}
                    >
                      <td className="px-3 py-2.5 sm:pl-1">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${kind.bg} ${kind.text} ${
                              isDark ? "ring-1 ring-white/10" : "ring-1 ring-slate-200"
                            }`}
                            title={file.fileName}
                          >
                            {kind.emoji}
                          </div>
                          <span className="min-w-0 truncate font-medium">{file.fileName}</span>
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        <div className="min-w-0">
                          <span className="block truncate">{file.subjectName || "—"}</span>
                          {file.assignmentId && file.assignmentTitle ? (
                            <span
                              className={`mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${
                                file.assignmentType === "quiz"
                                  ? isDark
                                    ? "bg-cyan-500/15 text-cyan-200 ring-cyan-500/25"
                                    : "bg-cyan-50 text-cyan-900 ring-cyan-200"
                                  : isDark
                                    ? "bg-violet-500/15 text-violet-200 ring-violet-500/25"
                                    : "bg-violet-50 text-violet-900 ring-violet-200"
                              }`}
                              title={`${file.assignmentType === "quiz" ? "Quiz" : "Assignment"}: ${file.assignmentTitle}`}
                            >
                              📎 {file.assignmentType === "quiz" ? "Quiz" : "Assign"} · {file.assignmentTitle}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        {formatBytes(file.fileSize)}
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <p
                          className={`whitespace-normal break-all text-left text-xs font-normal leading-relaxed ${
                            isDark ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          {normalizeFsPath(file.filePath) || "—"}
                        </p>
                      </td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        {file.createdAt ? format(new Date(file.createdAt), "dd MMM yyyy HH:mm") : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right sm:pr-1">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <ActionBtn
                            tone="emerald"
                            onClick={() => openFile(file.filePath)}
                            label="Open"
                            icon={<EyeIconSmall />}
                            isDark={isDark}
                          />
                          <ActionBtn
                            tone="amber"
                            onClick={() => revealFile(file.filePath)}
                            label="Reveal"
                            icon={<FolderIconSmall />}
                            isDark={isDark}
                          />
                          <ActionBtn
                            tone="rose"
                            onClick={() => removeFile(file.id)}
                            label="Delete"
                            icon={<TrashIconSmall />}
                            isDark={isDark}
                          />
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

      <p className={`text-center text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
        © 2026 Student Management System. All rights reserved.
      </p>

      {pendingPaths.length > 0 ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={
              isDark
                ? "w-full max-w-md rounded-2xl border border-white/10 bg-app-card p-5 shadow-card"
                : "w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
            }
          >
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Select course</h3>
            <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Choose which course these files belong to, then add them.
            </p>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className={
                isDark
                  ? "mt-4 w-full rounded-xl border border-white/10 bg-app-surface px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  : "mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
              }
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingPaths([])}
                className={
                  isDark
                    ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                    : "rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-800 hover:bg-slate-200"
                }
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => uploadFromPaths(pendingPaths, selectedSubjectId)}
                disabled={!selectedSubjectId || uploading}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Adding…" : "Add files"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionBtn({ label, onClick, tone, icon, isDark }) {
  const tones = {
    emerald: isDark
      ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
      : "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    amber: isDark
      ? "border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
      : "border-amber-300 text-amber-800 hover:bg-amber-50",
    rose: isDark ? "border-rose-500/40 text-rose-300 hover:bg-rose-500/10" : "border-rose-300 text-rose-700 hover:bg-rose-50"
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border bg-transparent px-2 py-1 text-xs font-medium transition ${tones[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}

function EyeIconSmall() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function FolderIconSmall() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7h5l1.4 2.2A2 2 0 0011.2 10H20a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z"
      />
    </svg>
  );
}

function TrashIconSmall() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
