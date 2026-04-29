const db = require("../db");

const listBySemesterStmt = db.prepare(`
  SELECT a.id, a.subjectId, s.semesterId, s.name AS subjectName, a.title, a.type, a.dueDate, a.status, a.marks, a.details, a.reminderAt
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

function listBySemester(semesterId) {
  return listBySemesterStmt.all(semesterId);
}

function save(payload) {
  if (payload.id) updateStmt.run(payload);
  else insertStmt.run(payload);
  return listBySemester(payload.semesterId);
}

function remove(assignmentId, semesterId) {
  deleteStmt.run(assignmentId);
  return listBySemester(semesterId);
}

module.exports = { listBySemester, save, remove };
