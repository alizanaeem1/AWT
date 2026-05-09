const fs = require("fs");
const path = require("path");
const { getDataRoot } = require("../paths");
const db = require("../db");

/** Lists every file in the semester — course uploads and assignment/quiz attachments (Files tab shows all). */
const listStmt = db.prepare(`
  SELECT
    f.id,
    f.semesterId,
    f.subjectId,
    f.assignmentId,
    s.name AS subjectName,
    a.title AS assignmentTitle,
    a.type AS assignmentType,
    f.fileName,
    f.filePath,
    f.fileSize,
    f.createdAt
  FROM Files f
  LEFT JOIN Subjects s ON s.id = f.subjectId
  LEFT JOIN Assignments a ON a.id = f.assignmentId
  WHERE f.semesterId = ?
  ORDER BY f.createdAt DESC
`);
const listByAssignmentStmt = db.prepare(`
  SELECT f.id, f.semesterId, f.subjectId, f.assignmentId, f.fileName, f.filePath, f.fileSize, f.createdAt
  FROM Files f
  WHERE f.assignmentId = ?
  ORDER BY f.createdAt DESC
`);

/** Includes assignment-linked uploads (ZIP export uses this; Files tab uses {@link list}). */
const listAllSemesterStmt = db.prepare(`
  SELECT
    f.id,
    f.semesterId,
    f.subjectId,
    f.assignmentId,
    s.name AS subjectName,
    a.title AS assignmentTitle,
    a.type AS assignmentType,
    f.fileName,
    f.filePath,
    f.fileSize,
    f.createdAt
  FROM Files f
  LEFT JOIN Subjects s ON s.id = f.subjectId
  LEFT JOIN Assignments a ON a.id = f.assignmentId
  WHERE f.semesterId = ?
  ORDER BY f.createdAt DESC
`);
const insertStmt = db.prepare(
  "INSERT INTO Files (semesterId, subjectId, assignmentId, fileName, filePath, fileSize) VALUES (@semesterId, @subjectId, @assignmentId, @fileName, @filePath, @fileSize)"
);
const deleteStmt = db.prepare("DELETE FROM Files WHERE id = ?");
const selectAssignmentFilesStmt = db.prepare("SELECT id, filePath FROM Files WHERE assignmentId = ?");

function list(semesterId) {
  return listStmt.all(semesterId);
}

function listAllForSemester(semesterId) {
  return listAllSemesterStmt.all(semesterId);
}

function listByAssignment(assignmentId) {
  const aid = Number(assignmentId);
  if (!Number.isFinite(aid)) return [];
  return listByAssignmentStmt.all(aid);
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
    assignmentId: payload.assignmentId != null && Number.isFinite(Number(payload.assignmentId)) ? Number(payload.assignmentId) : null,
    fileName: originalName,
    filePath: destinationPath,
    fileSize: fileStats.size
  });
  return list(payload.semesterId);
}

/** Delete all disk + DB rows for files linked to an assignment (used before deleting the assignment). */
function removeAssignmentFiles(assignmentId) {
  const aid = Number(assignmentId);
  if (!Number.isFinite(aid)) return;
  const rows = selectAssignmentFilesStmt.all(aid);
  for (const r of rows) {
    try {
      if (r.filePath && fs.existsSync(r.filePath)) fs.unlinkSync(r.filePath);
    } catch (_) {
      /* ignore */
    }
    deleteStmt.run(r.id);
  }
}

function remove(fileId, semesterId) {
  const id = Number(fileId);
  if (!Number.isFinite(id)) return list(semesterId);
  const row = db.prepare("SELECT id, filePath FROM Files WHERE id = ?").get(id);
  if (row?.filePath) {
    try {
      if (fs.existsSync(row.filePath)) fs.unlinkSync(row.filePath);
    } catch (_) {
      /* ignore */
    }
  }
  deleteStmt.run(id);
  return list(semesterId);
}

module.exports = {
  list,
  listAllForSemester,
  listByAssignment,
  add,
  remove,
  removeAssignmentFiles
};
