const fs = require("fs");
const path = require("path");
const { getDataRoot } = require("../paths");
const db = require("../db");

const listStmt = db.prepare(`
  SELECT f.id, f.semesterId, f.subjectId, s.name AS subjectName, f.fileName, f.filePath, f.fileSize, f.createdAt
  FROM Files f
  LEFT JOIN Subjects s ON s.id = f.subjectId
  WHERE f.semesterId = ?
  ORDER BY f.createdAt DESC
`);
const insertStmt = db.prepare(
  "INSERT INTO Files (semesterId, subjectId, fileName, filePath, fileSize) VALUES (@semesterId, @subjectId, @fileName, @filePath, @fileSize)"
);
const deleteStmt = db.prepare("DELETE FROM Files WHERE id = ?");

function list(semesterId) {
  return listStmt.all(semesterId);
}

function add(payload) {
  const uploadsRoot = path.join(getDataRoot(), "uploads", String(payload.semesterId));
  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  }

  const originalName = path.basename(payload.sourcePath);
  const storedName = `${Date.now()}-${originalName}`;
  const destinationPath = path.join(uploadsRoot, storedName);
  fs.copyFileSync(payload.sourcePath, destinationPath);
  const fileStats = fs.statSync(destinationPath);

  insertStmt.run({
    semesterId: payload.semesterId,
    subjectId: payload.subjectId || null,
    fileName: originalName,
    filePath: destinationPath,
    fileSize: fileStats.size
  });
  return list(payload.semesterId);
}

function remove(fileId, semesterId) {
  deleteStmt.run(fileId);
  return list(semesterId);
}

module.exports = { list, add, remove };
