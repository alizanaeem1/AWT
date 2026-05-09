const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const db = require("../db");
const subjectService = require("./subjectService");
const assignmentService = require("./assignmentService");
const fileService = require("./fileService");

const getSemesterRow = db.prepare("SELECT * FROM Semesters WHERE id = ? AND userId = ?");

function safeFilePart(name) {
  return String(name || "file")
    .replace(/[/\\?*:|"<>]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function formatSemesterForExport(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    isActive: Number(row.isActive) === 1,
    startDate: row.startDate,
    endDate: row.endDate,
    gpa: row.gpa,
    totalCreditHours: row.totalCreditHours,
    expectedSubjects: row.expectedSubjects,
    createdAt: row.createdAt
  };
}

function buildFileSnapshot(fileRow, fallbackPath) {
  return {
    id: fileRow.id,
    fileName: fileRow.fileName,
    subjectName: fileRow.subjectName || null,
    subjectId: fileRow.subjectId ?? null,
    assignmentId: fileRow.assignmentId ?? null,
    assignmentTitle: fileRow.assignmentTitle || null,
    assignmentType: fileRow.assignmentType || null,
    pathInZip: fallbackPath ?? null,
    size: fileRow.fileSize ?? null
  };
}

/** Folder inside the ZIP per course (survives duplicate subject names thanks to ID prefix). */
function subjectFolderInZip(subjectId, subjectDisplayName) {
  const sid = Number(subjectId);
  const safe = safeFilePart(subjectDisplayName || "Course");
  return `subject-files/${sid}-${safe}`;
}

/** Path for one uploaded row: nested by subject → course material vs assignment/quiz. */
function zipPathForUploadedFile(f, subjectsById) {
  const safe = safeFilePart(f.fileName);
  const fileLeaf = `${f.id}-${safe}`;
  const sid = Number(f.subjectId);
  const displayName =
    (Number.isFinite(sid) && sid > 0 && subjectsById.has(sid) ? subjectsById.get(sid).name : null) ||
    f.subjectName ||
    "Course";

  if (Number.isFinite(sid) && sid > 0) {
    const root = subjectFolderInZip(sid, displayName);
    const aid = Number(f.assignmentId);
    if (Number.isFinite(aid) && aid > 0) {
      const typeTag = String(f.assignmentType || "").toLowerCase() === "quiz" ? "quiz" : "assignment";
      const titlePart = safeFilePart(f.assignmentTitle || "item").slice(0, 120);
      return `${root}/${typeTag}-${aid}-${titlePart}/${fileLeaf}`;
    }
    return `${root}/course-material/${fileLeaf}`;
  }

  return `other-files/${fileLeaf}`;
}

/**
 * Build a .zip for one semester: manifest.json, uploaded files, subject images, full rows for courses / assignments (assignments + quizzes).
 * @param {number} semesterId
 * @param {number} userId
 * @param {string} outPath
 * @returns {Promise<{ filesIncluded: number, filesMissing: number, subjectImages: number }>}
 */
async function writeSemesterExportZip(semesterId, userId, outPath) {
  const id = Number(semesterId);
  const uid = Number(userId);
  if (!Number.isFinite(id) || !Number.isFinite(uid)) {
    throw new Error("Invalid semester or user.");
  }
  const semRow = getSemesterRow.get(id, uid);
  if (!semRow) {
    throw new Error("Semester not found.");
  }

  const subjects = subjectService.list(id);
  const subjectsById = new Map(subjects.map((s) => [Number(s.id), s]));
  const assignments = assignmentService.listBySemester(id);
  const fileRows = fileService.listAllForSemester(id);

  const fileIndex = [];
  const zippedByFileId = new Map();
  let filesIncluded = 0;
  let filesMissing = 0;
  let subjectImages = 0;

  const output = fs.createWriteStream(outPath);
  const archive = archiver("zip", { zlib: { level: 6 } });

  const finished = new Promise((resolve, reject) => {
    output.on("error", reject);
    archive.on("error", reject);
    output.on("close", () => resolve());
  });
  archive.pipe(output);

  for (const f of fileRows) {
    const zipName = zipPathForUploadedFile(f, subjectsById);
    if (f.filePath && fs.existsSync(f.filePath)) {
      try {
        archive.file(f.filePath, { name: zipName });
        fileIndex.push({
          id: f.id,
          fileName: f.fileName,
          subjectName: f.subjectName,
          subjectId: f.subjectId,
          assignmentId: f.assignmentId ?? null,
          assignmentTitle: f.assignmentTitle || null,
          assignmentType: f.assignmentType || null,
          pathInZip: zipName,
          size: f.fileSize
        });
        zippedByFileId.set(Number(f.id), zipName);
        filesIncluded += 1;
      } catch (e) {
        fileIndex.push({ id: f.id, fileName: f.fileName, error: e.message || "read failed" });
        filesMissing += 1;
      }
    } else {
      fileIndex.push({ id: f.id, fileName: f.fileName, pathInZip: null, error: "file not on disk" });
      filesMissing += 1;
    }
  }

  const fileRowsBySubject = new Map();
  const fileRowsByAssignment = new Map();
  for (const f of fileRows) {
    const sid = Number(f.subjectId);
    if (Number.isFinite(sid) && sid > 0) {
      if (!fileRowsBySubject.has(sid)) fileRowsBySubject.set(sid, []);
      fileRowsBySubject.get(sid).push(f);
    }
    const aid = Number(f.assignmentId);
    if (Number.isFinite(aid) && aid > 0) {
      if (!fileRowsByAssignment.has(aid)) fileRowsByAssignment.set(aid, []);
      fileRowsByAssignment.get(aid).push(f);
    }
  }

  const assignmentManifest = assignments.map((a) => {
    const assignmentFiles = (fileRowsByAssignment.get(Number(a.id)) || []).map((f) =>
      buildFileSnapshot(f, zippedByFileId.get(Number(f.id)))
    );
    return {
      ...a,
      attachedFiles: assignmentFiles
    };
  });

  const assignmentsBySubject = new Map();
  for (const a of assignmentManifest) {
    const sid = Number(a.subjectId);
    if (!Number.isFinite(sid) || sid <= 0) continue;
    if (!assignmentsBySubject.has(sid)) assignmentsBySubject.set(sid, []);
    assignmentsBySubject.get(sid).push(a);
  }

  const subjectManifest = subjects.map((s) => {
    let imageInZip = null;
    if (s.imagePath && fs.existsSync(s.imagePath)) {
      const base = safeFilePart(path.basename(s.imagePath));
      const subjectRoot = subjectFolderInZip(s.id, s.name);
      imageInZip = `${subjectRoot}/_subject-image-${base}`;
      try {
        archive.file(s.imagePath, { name: imageInZip });
        subjectImages += 1;
      } catch {
        imageInZip = null;
      }
    }
    const sid = Number(s.id);
    const subjectFiles = (fileRowsBySubject.get(sid) || []).map((f) => buildFileSnapshot(f, zippedByFileId.get(Number(f.id))));
    return {
      id: s.id,
      name: s.name,
      professorName: s.professorName,
      creditHours: s.creditHours,
      gradePoint: s.gradePoint,
      imageInZip: imageInZip,
      files: subjectFiles,
      assignmentsAndQuizzes: assignmentsBySubject.get(sid) || []
    };
  });

  const manifest = {
    exportVersion: 3,
    exportedAt: new Date().toISOString(),
    app: "student-management-desktop",
    description:
      "Semester backup: manifest + uploads under subject-files/{subjectId}-{name}/ (course-material vs assignment/quiz folders), nested assignments in manifest.",
    semester: formatSemesterForExport(semRow),
    subjects: subjectManifest,
    assignments: assignmentManifest,
    files: fileIndex
  };

  const manifestText = JSON.stringify(manifest, null, 2);
  archive.append(manifestText, { name: "manifest.json" });

  await archive.finalize();
  await finished;

  return { filesIncluded, filesMissing, subjectImages };
}

module.exports = { writeSemesterExportZip };
