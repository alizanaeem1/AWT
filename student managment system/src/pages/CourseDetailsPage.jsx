import React, { useEffect, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";

export default function CourseDetailsPage({ subject, onBack }) {
  const { activeSemester, theme, pushToast } = useApp();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!activeSemester || !subject?.id) return;
    let cancelled = false;
    (async function loadDetails() {
      setLoading(true);
      const [assignmentRes, filesRes] = await Promise.all([
        desktopAPI.assignments.listBySemester(activeSemester.id),
        desktopAPI.files.list(activeSemester.id)
      ]);
      if (cancelled) return;
      setAssignments(
        assignmentRes.ok ? (assignmentRes.data || []).filter((item) => Number(item.subjectId) === Number(subject.id)) : []
      );
      setFiles(filesRes.ok ? (filesRes.data || []).filter((item) => Number(item.subjectId) === Number(subject.id)) : []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSemester, subject]);

  async function openFile(filePath) {
    const res = await desktopAPI.files.open(filePath);
    if (!res.ok) return pushToast({ title: "Open failed", message: res.error || "Could not open file.", variant: "error" });
    pushToast({ title: "Successful", message: "File opened successfully.", variant: "success" });
  }

  if (!subject) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-app-card p-8 text-center text-slate-400">
        No course selected. Go back and choose a course.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/[0.06] bg-app-card p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>📘 {subject.name}</h2>
            <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {subject.professorName || "Course details"} • {subject.creditHours} credits
              {subject.gradePoint != null &&
              subject.gradePoint !== "" &&
              !Number.isNaN(Number(subject.gradePoint)) ? (
                <span className={isDark ? " text-emerald-300/95" : " text-emerald-700"}>
                  {" "}
                  • GPA {Number(subject.gradePoint).toFixed(2)}
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            ← Back to Courses
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/[0.06] bg-app-card p-4 shadow-card">
          <h3 className="mb-3 text-base font-bold text-slate-200">Assignments & Quiz</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-slate-500">No assignments or quizzes found for this course.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((item) => {
                const due = parseISO(item.dueDate);
                return (
                  <article key={item.id} className="rounded-lg border border-white/10 bg-app-surface/70 p-3">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.type === "quiz" ? "Quiz" : "Assignment"} • {isValid(due) ? format(due, "dd MMM yyyy") : item.dueDate}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-white/[0.06] bg-app-card p-4 shadow-card">
          <h3 className="mb-3 text-base font-bold text-slate-200">Files</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-slate-500">No files found for this course.</p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => openFile(file.filePath)}
                  className="block w-full rounded-lg border border-white/10 bg-app-surface/70 p-3 text-left transition hover:border-indigo-400/40 hover:bg-app-surface"
                >
                  <p className="truncate text-sm font-semibold text-indigo-200">{file.fileName}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{file.filePath}</p>
                </button>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
