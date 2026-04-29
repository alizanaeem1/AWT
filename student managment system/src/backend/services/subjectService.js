const db = require("../db");

const listStmt = db.prepare(
  "SELECT id, semesterId, name, professorName, imagePath, creditHours, gradePoint FROM Subjects WHERE semesterId = ? ORDER BY createdAt DESC"
);
const insertStmt = db.prepare(
  "INSERT INTO Subjects (semesterId, name, professorName, imagePath, creditHours, gradePoint) VALUES (@semesterId, @name, @professorName, @imagePath, @creditHours, @gradePoint)"
);
const updateStmt = db.prepare(
  "UPDATE Subjects SET name = @name, professorName = @professorName, imagePath = @imagePath, creditHours = @creditHours, gradePoint = @gradePoint WHERE id = @id"
);
const deleteStmt = db.prepare("DELETE FROM Subjects WHERE id = ?");

function list(semesterId) {
  return listStmt.all(semesterId);
}

function save(payload) {
  const row = { ...payload };
  if (row.gradePoint != null && row.gradePoint !== "") {
    const g = Number(row.gradePoint);
    if (Number.isNaN(g) || g < 0 || g > 4) {
      throw new Error("Course GPA (grade point) must be between 0.00 and 4.00.");
    }
    row.gradePoint = Math.round(g * 100) / 100;
  } else {
    row.gradePoint = null;
  }
  if (row.id) updateStmt.run(row);
  else insertStmt.run(row);
  return list(payload.semesterId);
}

function remove(subjectId, semesterId) {
  deleteStmt.run(subjectId);
  return list(semesterId);
}

module.exports = { list, save, remove };
