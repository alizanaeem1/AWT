const db = require("../db");

const listStmt = db.prepare(`
  SELECT
    id,
    userId,
    semesterId,
    title,
    dayOfWeek,
    startTime,
    endTime,
    location,
    notifyMinutesBefore,
    enabled,
    createdAt
  FROM TimetableEntries
  WHERE semesterId = ?
  ORDER BY dayOfWeek ASC, startTime ASC
`);

function assertSemesterOwned(semesterId, userId) {
  const row = db.prepare("SELECT id FROM Semesters WHERE id = ? AND userId = ?").get(semesterId, userId);
  if (!row) {
    throw new Error("Semester not found.");
  }
}

function normalizeDayOfWeek(v) {
  const n = parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 0 || n > 6) {
    throw new Error("Day must be 0 (Sun) through 6 (Sat).");
  }
  return n;
}

const timeRe = /^([0-1]?\d|2[0-3]):([0-5]\d)$/;

function normalizeTime(label, v) {
  if (v == null || String(v).trim() === "") {
    throw new Error(`${label} is required.`);
  }
  const t = String(v).trim();
  if (!timeRe.test(t)) {
    throw new Error(`${label} must be HH:mm (24h).`);
  }
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const insertStmt = db.prepare(`
  INSERT INTO TimetableEntries (
    userId, semesterId, title, dayOfWeek, startTime, endTime, location, notifyMinutesBefore, enabled
  ) VALUES (
    @userId, @semesterId, @title, @dayOfWeek, @startTime, @endTime, @location, @notifyMinutesBefore, @enabled
  )
`);

const updateStmt = db.prepare(`
  UPDATE TimetableEntries SET
    title = @title,
    dayOfWeek = @dayOfWeek,
    startTime = @startTime,
    endTime = @endTime,
    location = @location,
    notifyMinutesBefore = @notifyMinutesBefore,
    enabled = @enabled
  WHERE id = @id AND semesterId = @semesterId AND userId = @userId
`);

const deleteStmt = db.prepare(`
  DELETE FROM TimetableEntries WHERE id = ? AND semesterId = ? AND userId = ?
`);

function listBySemester({ semesterId, userId }) {
  assertSemesterOwned(semesterId, userId);
  return listStmt.all(semesterId);
}

function save(payload) {
  const userId = Number(payload?.userId);
  const semesterId = Number(payload?.semesterId);
  if (!Number.isFinite(userId) || !Number.isFinite(semesterId)) {
    throw new Error("Invalid session or semester.");
  }
  assertSemesterOwned(semesterId, userId);

  const title = String(payload?.title || "").trim();
  if (!title) throw new Error("Title is required.");

  const dayOfWeek = normalizeDayOfWeek(payload?.dayOfWeek);
  const startTime = normalizeTime("Start time", payload?.startTime);
  const endTime = normalizeTime("End time", payload?.endTime);

  const startParts = startTime.split(":").map((x) => parseInt(x, 10));
  const endParts = endTime.split(":").map((x) => parseInt(x, 10));
  const startM = startParts[0] * 60 + startParts[1];
  const endM = endParts[0] * 60 + endParts[1];
  if (endM <= startM) throw new Error("End time must be after start time.");

  let notifyMinutesBefore = parseInt(payload?.notifyMinutesBefore, 10);
  if (!Number.isFinite(notifyMinutesBefore) || notifyMinutesBefore < 0) {
    notifyMinutesBefore = 10;
  }
  if (notifyMinutesBefore > 24 * 60) notifyMinutesBefore = 24 * 60;

  const enabled = payload?.enabled === false || payload?.enabled === 0 ? 0 : 1;
  const location =
    payload?.location != null && String(payload.location).trim() !== "" ? String(payload.location).trim() : null;

  const row = {
    userId,
    semesterId,
    title,
    dayOfWeek,
    startTime,
    endTime,
    location,
    notifyMinutesBefore,
    enabled
  };

  const rawExisting = payload?.id;
  const existingId = rawExisting != null && rawExisting !== "" ? Number(rawExisting) : NaN;
  if (Number.isFinite(existingId) && existingId > 0) {
    updateStmt.run({ ...row, id: existingId });
    return listBySemester({ semesterId, userId });
  }
  insertStmt.run(row);
  return listBySemester({ semesterId, userId });
}

function remove({ id, semesterId, userId }) {
  const uid = Number(userId);
  const sid = Number(semesterId);
  const eid = Number(id);
  if (!Number.isFinite(uid) || !Number.isFinite(sid) || !Number.isFinite(eid)) {
    throw new Error("Invalid request.");
  }
  assertSemesterOwned(sid, uid);
  deleteStmt.run(eid, sid, uid);
  return listBySemester({ semesterId: sid, userId: uid });
}

module.exports = { listBySemester, save, remove };
