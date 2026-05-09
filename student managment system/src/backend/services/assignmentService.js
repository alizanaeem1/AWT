const fileService = require("./fileService");
const db = require("../db");

const listBySemesterStmt = db.prepare(`
  SELECT
    a.id,
    a.subjectId,
    s.semesterId,
    s.name AS subjectName,
    a.title,
    a.type,
    a.dueDate,
    a.status,
    a.marks,
    a.details,
    a.reminderAt,
    CAST((SELECT COUNT(*) FROM Files f WHERE f.assignmentId = a.id) AS INTEGER) AS attachmentCount,
    (SELECT GROUP_CONCAT(fa.fileName, ' · ') FROM Files fa WHERE fa.assignmentId = a.id) AS attachmentNames
  FROM Assignments a
  INNER JOIN Subjects s ON s.id = a.subjectId
  WHERE s.semesterId = ?
  ORDER BY a.dueDate ASC
`);

const insertStmt = db.prepare(
  "INSERT INTO Assignments (subjectId, title, type, dueDate, status, marks, details, reminderAt) VALUES (@subjectId, @title, @type, @dueDate, @status, @marks, @details, @reminderAt)"
);
const updateStmt = db.prepare(
  "UPDATE Assignments SET title=@title, type=@type, dueDate=@dueDate, status=@status, marks=@marks, details=@details, reminderAt=@reminderAt WHERE id=@id"
);
const deleteStmt = db.prepare("DELETE FROM Assignments WHERE id = ?");

function readInsertId(info) {
  const raw = info?.lastInsertRowid;
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === "bigint" ? Number(raw) : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function listBySemester(semesterId) {
  return listBySemesterStmt.all(semesterId);
}

/** @typedef {{ assignments: unknown[], insertedId: number|null }} SaveResult */

/** @returns {SaveResult} */
function save(payload) {
  const row = {
    id: payload.id,
    subjectId: payload.subjectId,
    title: payload.title,
    type: payload.type,
    dueDate: payload.dueDate,
    status: payload.status,
    marks: payload.marks ?? null,
    details: payload.details ?? null,
    reminderAt: payload.reminderAt ?? null
  };
  const rawExisting = payload.id;
  const existingId =
    rawExisting != null && rawExisting !== "" ? Number(rawExisting) : NaN;
  if (Number.isFinite(existingId) && existingId > 0) {
    updateStmt.run({ ...row, id: existingId });
    return { assignments: listBySemester(payload.semesterId), insertedId: null };
  }
  const info = insertStmt.run(row);
  const insertedId = readInsertId(info);
  return {
    assignments: listBySemester(payload.semesterId),
    insertedId
  };
}

function remove(assignmentId, semesterId) {
  fileService.removeAssignmentFiles(assignmentId);
  deleteStmt.run(assignmentId);
  return listBySemester(semesterId);
}

module.exports = { listBySemester, save, remove };
