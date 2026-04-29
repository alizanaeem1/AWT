import React, { useEffect, useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isSameMonth, isValid, parseISO, startOfMonth, subMonths } from "date-fns";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";

export default function CalendarPage() {
  const { activeSemester, dataVersion } = useApp();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (!activeSemester) return;
    loadAssignments();
  }, [activeSemester, dataVersion]);

  async function loadAssignments() {
    const res = await desktopAPI.assignments.listBySemester(activeSemester.id);
    if (res.ok) setAssignments(res.data);
  }

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const mondayFirstOffset = (getDay(monthStart) + 6) % 7;
  const leadingBlanks = Array.from({ length: mondayFirstOffset }, (_, i) => `blank-${i}`);

  const selectedMonthItems = useMemo(
    () =>
      assignments
        .filter((item) => {
          const parsed = parseISO(item.dueDate);
          return isValid(parsed) && isSameMonth(parsed, calendarMonth);
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [assignments, calendarMonth]
  );

  if (!activeSemester) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center text-gray-400">
        Select or create a semester first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-[#eef1f8] to-[#e5e8f1] p-5 text-slate-800 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-700">Deadline Calendar</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarMonth((prev) => subMonths(prev, 1))}
              className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow hover:bg-slate-100"
            >
              &lt;
            </button>
            <span className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow">{format(calendarMonth, "MMMM")}</span>
            <span className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow">{format(calendarMonth, "yyyy")}</span>
            <button
              onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
              className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow hover:bg-slate-100"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-slate-600">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {leadingBlanks.map((id) => (
            <div key={id} className="h-12 rounded-lg bg-transparent" />
          ))}
          {monthDays.map((date) => {
            const dayItems = assignments.filter((item) => {
              const parsed = parseISO(item.dueDate);
              return isValid(parsed) && isSameDay(parsed, date);
            });
            const hasQuiz = dayItems.some((item) => item.type === "quiz");
            const hasAssignment = dayItems.some((item) => item.type === "assignment");
            const baseCellClass = "h-12 rounded-lg border p-1.5 text-center transition";
            const defaultCellClass = "border-slate-300 bg-white text-slate-700";
            // Match highlighted dates with the requested dark-blue calendar tone.
            const assignmentClass = "border-[#263f77] bg-[#1f325f] text-white shadow-md shadow-[#1f325f]/40";
            const quizClass = "border-[#304a87] bg-[#213968] text-white shadow-md shadow-[#213968]/40";
            const mixedClass = "border-[#365295] bg-[#27457b] text-white shadow-md shadow-[#27457b]/45";
            const activeClass = hasQuiz && hasAssignment ? mixedClass : hasQuiz ? quizClass : hasAssignment ? assignmentClass : defaultCellClass;
            const selectedClass =
              selectedDate && isSameDay(date, selectedDate) ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-200" : "";
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`${baseCellClass} ${activeClass} ${selectedClass}`}
              >
                <p className="text-base font-semibold leading-none">{format(date, "d")}</p>
                {dayItems.length > 0 ? <p className="mt-1 text-[10px]">{dayItems.length} item(s)</p> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-300">This Month Schedule</h3>
        <div className="space-y-2">
          {selectedMonthItems.length === 0 ? (
            <p className="text-sm text-gray-500">No assignments/quizzes this month.</p>
          ) : (
            selectedMonthItems.map((item) => (
              (() => {
                const dueDate = parseISO(item.dueDate);
                const isSelected = selectedDate && isValid(dueDate) && isSameDay(dueDate, selectedDate);
                return (
              <article
                key={item.id}
                className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between ${
                  isSelected ? "border-cyan-400/70 bg-cyan-900/20 ring-1 ring-cyan-400/40" : "border-gray-700/70 bg-gray-800/70"
                }`}
              >
                <div className="min-w-0">
                  <p className="break-words text-sm text-white">{item.title}</p>
                  <p className="text-xs text-gray-400">
                    {item.subjectName} - {format(parseISO(item.dueDate), "dd MMM yyyy")}
                  </p>
                  {item.reminderAt ? <p className="text-xs text-indigo-300">Reminder: {format(parseISO(item.reminderAt), "dd MMM HH:mm")}</p> : null}
                </div>
                <span className="w-fit rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300 capitalize">{item.type}</span>
              </article>
                );
              })()
            ))
          )}
        </div>
      </section>
    </div>
  );
}
