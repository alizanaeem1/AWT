import React, { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  subMonths
} from "date-fns";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];

const emptyForm = {
  title: "",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  notifyMinutesBefore: 10,
  enabled: true
};

/** Columns: Monday → Sunday (matches academic timetables); dow = JS getDay (Sun=0 … Sat=6). */
const DAY_COLUMNS = [
  { short: "Mo", dow: 1 },
  { short: "Tu", dow: 2 },
  { short: "We", dow: 3 },
  { short: "Th", dow: 4 },
  { short: "Fr", dow: 5 },
  { short: "Sa", dow: 6 },
  { short: "Su", dow: 0 }
];

/**
 * Row = time block, columns = days. Break row matches common university layouts.
 * Entries appear in every row they overlap (multi-period classes repeat in each row).
 */
const TIMETABLE_GRID_SLOTS = [
  { start: "08:30", end: "10:00" },
  { start: "10:00", end: "11:30" },
  { start: "11:30", end: "13:00" },
  { break: true },
  { start: "13:30", end: "15:00" },
  { start: "15:00", end: "16:30" },
  { start: "16:30", end: "18:00" },
  { start: "18:00", end: "20:00" }
];

function toMinutes(timeStr) {
  const [h, m] = String(timeStr || "0:0").split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(h)) return 0;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

function formatSlotRange(start, end) {
  return `${start} – ${end}`;
}

function entryOverlapsSlot(entry, slot) {
  if (!slot || slot.break) return false;
  const es = toMinutes(entry.startTime);
  const ee = toMinutes(entry.endTime);
  const ss = toMinutes(slot.start);
  const se = toMinutes(slot.end);
  return es < se && ee > ss;
}

function firstDateInMonthWithDow(year, monthIndex, dow) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const dt = new Date(year, monthIndex, d);
    if (getDay(dt) === dow) return dt;
  }
  return new Date(year, monthIndex, 1);
}

function MonthNav({ calendarMonth, onPrev, onNext }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow hover:bg-slate-100"
      >
        &lt;
      </button>
      <span className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow">{format(calendarMonth, "MMMM")}</span>
      <span className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow">{format(calendarMonth, "yyyy")}</span>
      <button
        type="button"
        onClick={onNext}
        className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow hover:bg-slate-100"
      >
        &gt;
      </button>
    </div>
  );
}

function CalendarGrid({ mondayFirstOffset, children }) {
  return (
    <>
      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-slate-600">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {Array.from({ length: mondayFirstOffset }, (_, i) => (
          <div key={`blank-${i}`} className="h-12 rounded-lg bg-transparent" />
        ))}
        {children}
      </div>
    </>
  );
}

function TimetableDayGrid({ timetable, onCellDay }) {
  const active = useMemo(() => timetable.filter((t) => Number(t.enabled) !== 0), [timetable]);

  const unplaced = useMemo(() => {
    return active.filter((e) => !TIMETABLE_GRID_SLOTS.some((s) => !s.break && entryOverlapsSlot(e, s)));
  }, [active]);

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-violet-200/60 bg-white/90 shadow-inner">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-violet-200 bg-violet-50/90">
            <th className="sticky left-0 z-10 w-[100px] border-r border-violet-200 px-2 py-2 text-[11px] font-semibold text-slate-600">
              Time
            </th>
            {DAY_COLUMNS.map((col) => (
              <th key={col.short} className="min-w-[88px] px-1 py-2 text-center text-[11px] font-semibold text-violet-900">
                {col.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIMETABLE_GRID_SLOTS.map((slot, idx) => {
            if (slot.break) {
              return (
                <tr key={`break-${idx}`} className="border-y border-amber-200/80 bg-amber-50/90">
                  <td
                    colSpan={8}
                    className="px-2 py-1.5 text-center text-[10px] font-medium tracking-wide text-amber-900/90"
                  >
                    Break · typical lunch window (no slot — add classes outside these rows if needed)
                  </td>
                </tr>
              );
            }
            return (
              <tr key={`${slot.start}-${slot.end}`} className="border-b border-violet-100 hover:bg-violet-50/40">
                <td className="sticky left-0 z-10 border-r border-violet-100 bg-white/95 px-2 py-2 align-top text-[10px] font-medium text-slate-600">
                  {formatSlotRange(slot.start, slot.end)}
                </td>
                {DAY_COLUMNS.map((col) => {
                  const inCell = active.filter((e) => Number(e.dayOfWeek) === col.dow && entryOverlapsSlot(e, slot));
                  return (
                    <td key={`${col.dow}-${slot.start}`} className="border-l border-violet-50 px-1 py-1 align-top">
                      <button
                        type="button"
                        onClick={() => onCellDay(col.dow)}
                        className="group min-h-[52px] w-full rounded-md px-0.5 py-0.5 text-left transition hover:bg-violet-100/80"
                      >
                        <div className="flex flex-col gap-1">
                          {inCell.length === 0 ? (
                            <span className="block py-1 text-center text-[10px] text-slate-300 group-hover:text-slate-400">—</span>
                          ) : (
                            inCell.map((e) => (
                              <div
                                key={`${e.id}-${slot.start}`}
                                className="rounded border border-violet-300/80 bg-gradient-to-br from-violet-600 to-violet-700 px-1.5 py-1 text-[10px] leading-snug text-white shadow-sm"
                              >
                                <p className="font-semibold">{e.title}</p>
                                <p className="mt-0.5 opacity-95">
                                  {e.startTime}–{e.endTime}
                                  {e.location ? ` · ${e.location}` : ""}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {unplaced.length > 0 ? (
        <div className="border-t border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-950">
          <span className="font-semibold">Outside grid hours: </span>
          {unplaced.map((e) => (
            <span key={e.id} className="mr-2 inline-block">
              {WEEKDAYS.find((w) => w.value === Number(e.dayOfWeek))?.label} {e.startTime}–{e.endTime}: {e.title}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CalendarPage() {
  const { user, activeSemester, dataVersion, bumpDataVersion, pushToast } = useApp();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showTimetableForm, setShowTimetableForm] = useState(false);

  useEffect(() => {
    if (!activeSemester || !user?.id) return;
    loadAssignments();
    loadTimetable();
  }, [activeSemester, dataVersion, user?.id]);

  async function loadAssignments() {
    const res = await desktopAPI.assignments.listBySemester(activeSemester.id);
    if (res.ok) setAssignments(res.data);
  }

  async function loadTimetable() {
    const res = await desktopAPI.timetable.listBySemester({
      semesterId: activeSemester.id,
      userId: user.id
    });
    if (res.ok) setTimetable(res.data || []);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openAddTimetable() {
    resetForm();
    const base = selectedDate ?? new Date();
    setForm({ ...emptyForm, dayOfWeek: getDay(base) });
    setShowTimetableForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!activeSemester || !user?.id) return;
    try {
      const res = await desktopAPI.timetable.save({
        ...form,
        semesterId: activeSemester.id,
        userId: user.id,
        ...(editingId ? { id: editingId } : {})
      });
      if (!res.ok) {
        pushToast({ title: "Could not save", message: res.error || "Try again.", variant: "error" });
        return;
      }
      setTimetable(res.data || []);
      bumpDataVersion();
      resetForm();
      setShowTimetableForm(false);
      pushToast({ title: "Timetable saved", message: "Your weekly slot was saved.", variant: "success" });
    } catch (err) {
      pushToast({ title: "Could not save", message: err?.message || "Try again.", variant: "error" });
    }
  }

  async function handleRemove(id) {
    if (!activeSemester || !user?.id) return;
    const res = await desktopAPI.timetable.remove({
      id,
      semesterId: activeSemester.id,
      userId: user.id
    });
    if (!res.ok) {
      pushToast({ title: "Could not remove", message: res.error || "Try again.", variant: "error" });
      return;
    }
    setTimetable(res.data || []);
    if (editingId === id) {
      resetForm();
      setShowTimetableForm(false);
    }
    bumpDataVersion();
    pushToast({ title: "Removed", message: "Timetable entry removed.", variant: "info" });
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      title: row.title || "",
      dayOfWeek: Number(row.dayOfWeek),
      startTime: row.startTime || "09:00",
      endTime: row.endTime || "10:00",
      location: row.location || "",
      notifyMinutesBefore: Number(row.notifyMinutesBefore) || 0,
      enabled: Boolean(Number(row.enabled))
    });
    setShowTimetableForm(true);
  }

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const mondayFirstOffset = (getDay(monthStart) + 6) % 7;

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

  function timetableSlotsForDate(date) {
    const dow = getDay(date);
    return timetable.filter((t) => Number(t.dayOfWeek) === dow && Number(t.enabled) !== 0);
  }

  const onPrevMonth = () => setCalendarMonth((prev) => subMonths(prev, 1));
  const onNextMonth = () => setCalendarMonth((prev) => addMonths(prev, 1));

  function handleTimetableGridDay(dow) {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    setSelectedDate(firstDateInMonthWithDow(y, m, dow));
  }

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
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-slate-700">Deadline calendar</h3>
          <MonthNav calendarMonth={calendarMonth} onPrev={onPrevMonth} onNext={onNextMonth} />
        </div>
        <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1f325f]" /> Due (assignment)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#213968]" /> Due (quiz)
          </span>
        </div>
        <CalendarGrid mondayFirstOffset={mondayFirstOffset}>
          {monthDays.map((date) => {
            const dayItems = assignments.filter((item) => {
              const parsed = parseISO(item.dueDate);
              return isValid(parsed) && isSameDay(parsed, date);
            });
            const hasQuiz = dayItems.some((item) => item.type === "quiz");
            const hasAssignment = dayItems.some((item) => item.type === "assignment");
            const baseCellClass = "h-12 rounded-lg border p-1.5 text-center transition";
            const defaultCellClass = "border-slate-300 bg-white text-slate-700";
            const assignmentClass = "border-[#263f77] bg-[#1f325f] text-white shadow-md shadow-[#1f325f]/40";
            const quizClass = "border-[#304a87] bg-[#213968] text-white shadow-md shadow-[#213968]/40";
            const mixedClass = "border-[#365295] bg-[#27457b] text-white shadow-md shadow-[#27457b]/45";
            const activeClass = hasQuiz && hasAssignment ? mixedClass : hasQuiz ? quizClass : hasAssignment ? assignmentClass : defaultCellClass;
            const selectedClass =
              selectedDate && isSameDay(date, selectedDate) ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-200" : "";
            return (
              <button
                key={`d-${date.toISOString()}`}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`${baseCellClass} ${activeClass} ${selectedClass}`}
              >
                <p className="text-base font-semibold leading-none">{format(date, "d")}</p>
                {dayItems.length > 0 ? <p className="mt-1 text-[10px]">{dayItems.length} item(s)</p> : <p className="mt-1 text-[10px] opacity-0">—</p>}
              </button>
            );
          })}
        </CalendarGrid>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-[#f0f1ff] to-[#e8e5f4] p-5 text-slate-800 shadow-lg">
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-700">Timetable (week view)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Rows = time blocks · Columns = Mon → Sun. Same classes repeat every week. Month for deadlines is chosen above.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (showTimetableForm ? (resetForm(), setShowTimetableForm(false)) : openAddTimetable())}
            className="shrink-0 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-500"
          >
            {showTimetableForm ? "Close form" : "Add timetable"}
          </button>
        </div>
        <TimetableDayGrid timetable={timetable} onCellDay={handleTimetableGridDay} />

        {showTimetableForm ? (
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-lg border border-violet-200/80 bg-white/70 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs text-slate-600">Title</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. CS101 Lecture"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-600">Day</span>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: parseInt(e.target.value, 10) }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-600">Start</span>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-600">End</span>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-600">Location (optional)</span>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-600">Notify (min before)</span>
              <input
                type="number"
                min={0}
                max={1440}
                value={form.notifyMinutesBefore}
                onChange={(e) => setForm((f) => ({ ...f, notifyMinutesBefore: parseInt(e.target.value, 10) || 0 }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
              />
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Reminders on</span>
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
              <button type="submit" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
                {editingId ? "Update slot" : "Save slot"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowTimetableForm(false);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        {timetable.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {timetable.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-lg border border-violet-200/50 bg-white/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-600">
                    {WEEKDAYS.find((d) => d.value === Number(row.dayOfWeek))?.label ?? "Day"} · {row.startTime}–{row.endTime}
                    {row.location ? ` · ${row.location}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(row.id)}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No timetable yet — click Add timetable to create weekly slots.</p>
        )}
      </section>

      {selectedDate ? (
        <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">{format(selectedDate, "EEEE, d MMMM yyyy")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Timetable (this weekday)</p>
              {timetableSlotsForDate(selectedDate).length === 0 ? (
                <p className="text-sm text-gray-500">No classes this weekday.</p>
              ) : (
                <ul className="space-y-2">
                  {timetableSlotsForDate(selectedDate).map((row) => (
                    <li key={row.id} className="rounded-lg border border-violet-900/40 bg-violet-950/20 px-3 py-2 text-sm text-gray-200">
                      <span className="font-medium">{row.title}</span>
                      <span className="text-gray-400">
                        {" "}
                        · {row.startTime}–{row.endTime}
                        {row.location ? ` · ${row.location}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Deadlines (this date)</p>
              {assignments.filter((a) => {
                const p = parseISO(a.dueDate);
                return isValid(p) && isSameDay(p, selectedDate);
              }).length === 0 ? (
                <p className="text-sm text-gray-500">Nothing due.</p>
              ) : (
                <ul className="space-y-2">
                  {assignments
                    .filter((a) => {
                      const p = parseISO(a.dueDate);
                      return isValid(p) && isSameDay(p, selectedDate);
                    })
                    .map((item) => (
                      <li key={item.id} className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200">
                        {item.title} <span className="text-gray-400">({item.subjectName}) · {item.type}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-300">This month — deadline list</h3>
        <div className="space-y-2">
          {selectedMonthItems.length === 0 ? (
            <p className="text-sm text-gray-500">No assignments or quizzes due this month.</p>
          ) : (
            selectedMonthItems.map((item) => {
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
                    {item.reminderAt ? (
                      <p className="text-xs text-indigo-300">Reminder: {format(parseISO(item.reminderAt), "dd MMM HH:mm")}</p>
                    ) : null}
                  </div>
                  <span className="w-fit rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300 capitalize">{item.type}</span>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
