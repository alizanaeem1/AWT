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
  const assignments = assignmentService.listBySemester(id);
  const fileRows = fileService.list(id);

  const fileIndex = [];
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
    const safe = safeFilePart(f.fileName);
    const zipName = `files/${f.id}-${safe}`;
    if (f.filePath && fs.existsSync(f.filePath)) {
      try {
        archive.file(f.filePath, { name: zipName });
        fileIndex.push({
          id: f.id,
          fileName: f.fileName,
          subjectName: f.subjectName,
          subjectId: f.subjectId,
          pathInZip: zipName,
          size: f.fileSize
        });
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

  const subjectManifest = subjects.map((s) => {
    let imageInZip = null;
    if (s.imagePath && fs.existsSync(s.imagePath)) {
      const base = safeFilePart(path.basename(s.imagePath));
      imageInZip = `subject-images/subject-${s.id}-${base}`;
      try {
        archive.file(s.imagePath, { name: imageInZip });
        subjectImages += 1;
      } catch {
        imageInZip = null;
      }
    }
    return {
      id: s.id,
      name: s.name,
      professorName: s.professorName,
      creditHours: s.creditHours,
      gradePoint: s.gradePoint,
      imageInZip: imageInZip
    };
  });

  const manifest = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "student-management-desktop",
    description:
      "Semester backup: includes manifest (JSON), all uploaded files, subject images, and all courses with assignments and quizzes (type field).",
    semester: formatSemesterForExport(semRow),
    subjects: subjectManifest,
    assignments,
    files: fileIndex
  };

  const manifestText = JSON.stringify(manifest, null, 2);
  archive.append(manifestText, { name: "manifest.json" });

  await archive.finalize();
  await finished;

  return { filesIncluded, filesMissing, subjectImages };
}

module.exports = { writeSemesterExportZip };
