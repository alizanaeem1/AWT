const db = require("../db");

const overviewStmt = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM Subjects WHERE semesterId = @semesterId) AS totalSubjects,
    (
      SELECT COUNT(*)
      FROM Assignments a
      INNER JOIN Subjects s ON s.id = a.subjectId
      WHERE s.semesterId = @semesterId
        AND a.status = 'pending'
        AND date(a.dueDate) >= date('now', 'localtime')
    ) AS pendingAssignments,
    (
      SELECT COUNT(*)
      FROM Assignments a
      INNER JOIN Subjects s ON s.id = a.subjectId
      WHERE s.semesterId = @semesterId
        AND a.status = 'pending'
        AND date(a.dueDate) < date('now', 'localtime')
    ) AS overdueAssignments
`);

const gpaTrendStmt = db.prepare(`
  SELECT sem.name,
    ROUND(COALESCE(
      SUM(CASE WHEN sub.gradePoint IS NOT NULL THEN sub.gradePoint * sub.creditHours END)
      / NULLIF(SUM(CASE WHEN sub.gradePoint IS NOT NULL THEN sub.creditHours END), 0),
    0), 2) AS gpa
  FROM Semesters sem
  LEFT JOIN Subjects sub ON sub.semesterId = sem.id
  WHERE sem.userId = ?
  GROUP BY sem.id
  ORDER BY sem.createdAt
`);

/** Pending with due date before today = overdue (same rule as assignments UI). */
const completionStmt = db.prepare(`
  SELECT status, COUNT(*) AS total
  FROM (
    SELECT
      CASE
        WHEN a.status = 'completed' THEN 'completed'
        WHEN a.status = 'pending' AND date(a.dueDate) < date('now', 'localtime') THEN 'overdue'
        ELSE 'pending'
      END AS status
    FROM Assignments a
    INNER JOIN Subjects s ON s.id = a.subjectId
    WHERE s.semesterId = ?
  )
  GROUP BY status
`);

const performanceStmt = db.prepare(`
  SELECT name, ROUND(COALESCE(gradePoint, 0), 2) AS gradePoint
  FROM Subjects
  WHERE semesterId = ?
  ORDER BY gradePoint DESC
`);

const recentActivityStmt = db.prepare(`
  SELECT label, createdAt
  FROM (
    SELECT 'Subject added: ' || name AS label, createdAt
    FROM Subjects
    WHERE semesterId = @semesterId

    UNION ALL

    SELECT UPPER(type) || ' created: ' || title AS label, a.createdAt
    FROM Assignments a
    INNER JOIN Subjects s ON s.id = a.subjectId
    WHERE s.semesterId = @semesterId

    UNION ALL

    SELECT 'File uploaded: ' || fileName AS label, createdAt
    FROM Files
    WHERE semesterId = @semesterId
  )
  ORDER BY datetime(createdAt) DESC
  LIMIT 5
`);

function getDashboard(payload) {
  const overview = overviewStmt.get({ semesterId: payload.semesterId });
  const gpaTrend = gpaTrendStmt.all(payload.userId);
  const completion = completionStmt.all(payload.semesterId);
  const subjectPerformance = performanceStmt.all(payload.semesterId);
  const recentActivity = recentActivityStmt.all({ semesterId: payload.semesterId });

  const currentGpa = gpaTrend.find((item) => item.name === payload.semesterName)?.gpa || 0;
  const cgpa = gpaTrend.length
    ? Number((gpaTrend.reduce((acc, item) => acc + Number(item.gpa || 0), 0) / gpaTrend.length).toFixed(2))
    : 0;

  return {
    currentGpa,
    cgpa,
    totalSubjects: overview.totalSubjects || 0,
    pendingAssignments: overview.pendingAssignments || 0,
    overdueAssignments: overview.overdueAssignments || 0,
    gpaTrend,
    completion,
    subjectPerformance,
    recentActivity
  };
}

module.exports = { getDashboard };
