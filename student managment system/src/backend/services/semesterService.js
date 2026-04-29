const db = require("../db");

const listStmt = db.prepare(`
  SELECT
    s.id,
    s.userId,
    s.name,
    s.isActive,
    s.createdAt,
    s.startDate,
    s.endDate,
    s.gpa,
    s.totalCreditHours,
    s.expectedSubjects,
    (SELECT COUNT(*) FROM Subjects sub WHERE sub.semesterId = s.id) AS subjectCount,
    (SELECT COALESCE(SUM(creditHours), 0) FROM Subjects sub WHERE sub.semesterId = s.id) AS creditsFromSubjects,
    (SELECT
      round(
        cast(sum(sub2.gradePoint * sub2.creditHours) AS real) / nullif(sum(sub2.creditHours), 0),
        2
      )
     FROM Subjects sub2
     WHERE sub2.semesterId = s.id
       AND sub2.gradePoint IS NOT NULL) AS gpaFromGrades
  FROM Semesters s
  WHERE s.userId = ?
  ORDER BY s.createdAt DESC
`);

/** Cumulative GPA: all graded course credits across every semester (one pool, not a mean of term GPAs). */
const overallCgpaFromGradesStmt = db.prepare(`
  SELECT
    SUM(CASE WHEN sub.gradePoint IS NOT NULL THEN sub.gradePoint * sub.creditHours END) AS sumQp,
    SUM(CASE WHEN sub.gradePoint IS NOT NULL THEN sub.creditHours END) AS sumCredits
  FROM Subjects sub
  INNER JOIN Semesters sem ON sem.id = sub.semesterId
  WHERE sem.userId = ?
`);

const createStmt = db.prepare(
  "INSERT INTO Semesters (userId, name, isActive, startDate, endDate, gpa, totalCreditHours, expectedSubjects) VALUES (@userId, @name, @isActive, @startDate, @endDate, @gpa, @totalCreditHours, @expectedSubjects)"
);

const deactivateStmt = db.prepare("UPDATE Semesters SET isActive = 0 WHERE userId = ?");
const activateStmt = db.prepare("UPDATE Semesters SET isActive = 1 WHERE id = ? AND userId = ?");

const getOne = db.prepare("SELECT * FROM Semesters WHERE id = ? AND userId = ?");
const deleteStmt = db.prepare("DELETE FROM Semesters WHERE id = ? AND userId = ?");
const pickNextActiveStmt = db.prepare(
  "SELECT id FROM Semesters WHERE userId = ? ORDER BY createdAt DESC LIMIT 1"
);

const updateRow = db.prepare(
  "UPDATE Semesters SET name = @name, startDate = @startDate, endDate = @endDate, gpa = @gpa, totalCreditHours = @totalCreditHours, expectedSubjects = @expectedSubjects WHERE id = @id AND userId = @userId"
);

function toIntOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function toFloatOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

/** YYYY-MM-DD, short ISO, or M/D/YYYY; empty / whitespace -> null. */
function toDateStringOrNull(v) {
  if (v == null) return null;
  const t = String(v).trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const mdy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const mm = mdy[1].padStart(2, "0");
    const dd = mdy[2].padStart(2, "0");
    return `${mdy[3]}-${mm}-${dd}`;
  }
  return t;
}

function pick(row, camelKey) {
  if (!row) return undefined;
  const lower = camelKey.charAt(0).toLowerCase() + camelKey.slice(1);
  const snake = camelKey.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, "");
  return (
    row[camelKey] ??
    row[lower] ??
    row[camelKey.toLowerCase()] ??
    (camelKey === "subjectCount" ? row.subjectcount : undefined) ??
    (camelKey === "creditsFromSubjects" ? row.creditsfromsubjects : undefined) ??
    (camelKey === "gpaFromGrades" ? row.gpafromgrades : undefined) ??
    (snake && row[snake] !== undefined ? row[snake] : undefined) ??
    (camelKey === "userId" ? row.userid : undefined) ??
    (camelKey === "totalCreditHours" ? row.totalcredithours : undefined) ??
    (camelKey === "expectedSubjects" ? row.expectedsubjects : undefined)
  );
}

/**
 * better-sqlite3 / SQLite can normalize alias casing; also coerce aggregates to numbers.
 */
function normalizeSemesterRow(row) {
  const sc = Number(pick(row, "subjectCount"));
  const cfs = Number(pick(row, "creditsFromSubjects"));
  const id = pick(row, "id") ?? row.id;
  const name = pick(row, "name") ?? row.name;
  const gpaRaw = pick(row, "gpa");
  const gpaFromGradesRaw = pick(row, "gpaFromGrades");
  const tch = pick(row, "totalCreditHours");
  const exp = pick(row, "expectedSubjects");
  const isActive = Number(pick(row, "isActive") ?? row.isActive) === 1;
  const startRaw = pick(row, "startDate");
  const endRaw = pick(row, "endDate");
  const savedGpa = gpaRaw != null && gpaRaw !== "" && !Number.isNaN(Number(gpaRaw)) ? Number(gpaRaw) : null;
  const fromGradesGpa =
    gpaFromGradesRaw != null && gpaFromGradesRaw !== "" && !Number.isNaN(Number(gpaFromGradesRaw))
      ? Number(gpaFromGradesRaw)
      : null;
  const mergedGpa =
    savedGpa != null
      ? savedGpa
      : fromGradesGpa != null && Number.isFinite(fromGradesGpa)
        ? fromGradesGpa
        : null;
  return {
    id,
    userId: pick(row, "userId") ?? row.userId,
    name,
    isActive,
    createdAt: pick(row, "createdAt") ?? row.createdAt,
    startDate: startRaw && String(startRaw).trim() ? String(startRaw).trim() : null,
    endDate: endRaw && String(endRaw).trim() ? String(endRaw).trim() : null,
    gpa: mergedGpa,
    gpaFromSaved: savedGpa != null,
    totalCreditHours: (() => {
      const v = tch;
      if (v == null || v === "") return null;
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : null;
    })(),
    expectedSubjects: (() => {
      const v = exp;
      if (v == null || v === "") return null;
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : null;
    })(),
    subjectCount: Number.isFinite(sc) ? sc : 0,
    creditsFromSubjects: Number.isFinite(cfs) ? cfs : 0
  };
}

function overallCgpaFromAllGradedCourses(userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return null;
  const row = overallCgpaFromGradesStmt.get(uid);
  const sumC = Number(row?.sumCredits ?? 0);
  if (!Number.isFinite(sumC) || sumC <= 0) return null;
  const sumQp = Number(row?.sumQp ?? 0);
  if (!Number.isFinite(sumQp)) return null;
  return Math.round((sumQp / sumC) * 100) / 100;
}

function list(userId) {
  const rows = listStmt.all(userId).map(normalizeSemesterRow);
  return {
    semesters: rows,
    overallCgpa: overallCgpaFromAllGradedCourses(userId)
  };
}

function create(payload) {
  const gpa = toFloatOrNull(payload.gpa);
  if (gpa != null && (gpa < 0 || gpa > 4)) {
    throw new Error("GPA must be between 0.00 and 4.00.");
  }
  const totalCreditHours = toIntOrNull(payload.totalCreditHours);
  if (totalCreditHours != null && totalCreditHours < 0) {
    throw new Error("Total credit hours cannot be negative.");
  }
  const expectedSubjects = toIntOrNull(payload.expectedSubjects);
  if (expectedSubjects != null && expectedSubjects < 0) {
    throw new Error("Expected subjects cannot be negative.");
  }

  const row = {
    userId: payload.userId,
    name: payload.name,
    isActive: payload.makeActive ? 1 : 0,
    startDate: toDateStringOrNull(payload.startDate),
    endDate: toDateStringOrNull(payload.endDate),
    gpa,
    totalCreditHours,
    expectedSubjects
  };

  const tx = db.transaction(() => {
    if (payload.makeActive) deactivateStmt.run(payload.userId);
    createStmt.run(row);
  });
  tx();
  return list(payload.userId);
}

function setActive(payload) {
  const tx = db.transaction(() => {
    deactivateStmt.run(payload.userId);
    activateStmt.run(payload.semesterId, payload.userId);
  });
  tx();
  return list(payload.userId);
}

/**
 * @param {object} payload - id, userId, and any of: name, startDate, endDate, gpa, totalCreditHours, expectedSubjects
 */
function getColumn(row, name) {
  if (!row) return undefined;
  return (
    row[name] ?? row[name.toLowerCase()] ?? row[name.charAt(0).toLowerCase() + name.slice(1)]
  );
}

/**
 * getOne() row uses SQLite column names; coalesce to avoid passing `undefined` into better-sqlite3
 * (which can skip the update or error). Always bind null, never undefined.
 */
function updateMeta(payload) {
  const id = Number(payload.id);
  const userId = Number(payload.userId);
  if (!Number.isFinite(id) || !Number.isFinite(userId)) {
    throw new Error("Invalid semester or user id.");
  }

  const current = getOne.get(id, userId);
  if (!current) throw new Error("Semester not found.");

  const name = (
    payload.name !== undefined
      ? String(payload.name)
      : String(getColumn(current, "name") ?? "")
  ).trim();
  if (!name) {
    throw new Error("Semester name is required.");
  }
  const startDate =
    payload.startDate !== undefined
      ? toDateStringOrNull(payload.startDate)
      : toDateStringOrNull(getColumn(current, "startDate"));
  const endDate =
    payload.endDate !== undefined
      ? toDateStringOrNull(payload.endDate)
      : toDateStringOrNull(getColumn(current, "endDate"));
  const gpa = payload.gpa !== undefined ? toFloatOrNull(payload.gpa) : toFloatOrNull(getColumn(current, "gpa"));
  const totalCreditHours =
    payload.totalCreditHours !== undefined
      ? toIntOrNull(payload.totalCreditHours)
      : toIntOrNull(getColumn(current, "totalCreditHours"));
  const expectedSubjects =
    payload.expectedSubjects !== undefined
      ? toIntOrNull(payload.expectedSubjects)
      : toIntOrNull(getColumn(current, "expectedSubjects"));

  if (gpa != null && (gpa < 0 || gpa > 4)) {
    throw new Error("GPA must be between 0.00 and 4.00.");
  }
  if (totalCreditHours != null && totalCreditHours < 0) {
    throw new Error("Total credit hours cannot be negative.");
  }
  if (expectedSubjects != null && expectedSubjects < 0) {
    throw new Error("Expected subjects cannot be negative.");
  }

  updateRow.run({
    id,
    userId,
    name,
    startDate: startDate == null ? null : startDate,
    endDate: endDate == null ? null : endDate,
    gpa: gpa == null ? null : gpa,
    totalCreditHours: totalCreditHours == null ? null : totalCreditHours,
    expectedSubjects: expectedSubjects == null ? null : expectedSubjects
  });
  return list(userId);
}

/**
 * Remove a term and dependent rows (subjects, etc. via CASCADE). If the deleted term was active,
 * the newest remaining term becomes active. Returns the updated list.
 */
function remove({ userId, semesterId }) {
  const id = Number(semesterId);
  const uid = Number(userId);
  if (!Number.isFinite(id) || !Number.isFinite(uid)) {
    throw new Error("Invalid semester or user id.");
  }
  const current = getOne.get(id, uid);
  if (!current) {
    throw new Error("Semester not found.");
  }
  const wasActive = Number(current.isActive) === 1;

  const tx = db.transaction(() => {
    deleteStmt.run(id, uid);
    if (wasActive) {
      const next = pickNextActiveStmt.get(uid);
      if (next) {
        deactivateStmt.run(uid);
        activateStmt.run(next.id, uid);
      }
    }
  });
  tx();
  return list(uid);
}

module.exports = { list, create, setActive, updateMeta, remove };
