const path = require("path");
const Database = require("better-sqlite3");
const { getDataRoot } = require("./paths");

const dbPath = path.join(getDataRoot(), "student-management.db");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Semesters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES Users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semesterId INTEGER NOT NULL,
    name TEXT NOT NULL,
    creditHours INTEGER NOT NULL,
    gradePoint REAL DEFAULT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(semesterId) REFERENCES Semesters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subjectId INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('assignment', 'quiz')),
    dueDate TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed')) DEFAULT 'pending',
    marks REAL DEFAULT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(subjectId) REFERENCES Subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semesterId INTEGER NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(semesterId) REFERENCES Semesters(id) ON DELETE CASCADE
  );
`);

function addColumnIfMissing(tableName, columnName, sqlType) {
  const existingColumns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = existingColumns.some((col) => col.name === columnName);
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sqlType}`);
  }
}

// Lightweight migrations for new fields without dropping user data.
addColumnIfMissing("Subjects", "professorName", "TEXT");
addColumnIfMissing("Subjects", "imagePath", "TEXT");
addColumnIfMissing("Assignments", "details", "TEXT");
addColumnIfMissing("Assignments", "reminderAt", "TEXT");
addColumnIfMissing("Users", "phone", "TEXT");
addColumnIfMissing("Users", "profileImagePath", "TEXT");
addColumnIfMissing("Files", "subjectId", "INTEGER");

addColumnIfMissing("Semesters", "startDate", "TEXT");
addColumnIfMissing("Semesters", "endDate", "TEXT");
addColumnIfMissing("Semesters", "gpa", "REAL");
addColumnIfMissing("Semesters", "totalCreditHours", "INTEGER");
addColumnIfMissing("Semesters", "expectedSubjects", "INTEGER");

db.exec(`
  CREATE TABLE IF NOT EXISTS TimetableEntries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    semesterId INTEGER NOT NULL,
    title TEXT NOT NULL,
    dayOfWeek INTEGER NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    location TEXT,
    notifyMinutesBefore INTEGER NOT NULL DEFAULT 10,
    enabled INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY(semesterId) REFERENCES Semesters(id) ON DELETE CASCADE
  );
`);

module.exports = db;
