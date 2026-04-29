const bcrypt = require("bcryptjs");
const db = require("../db");

const signupStmt = db.prepare(
  "INSERT INTO Users (fullName, email, passwordHash) VALUES (@fullName, @email, @passwordHash)"
);
const getUserByEmailStmt = db.prepare("SELECT * FROM Users WHERE email = ?");
const getProfileStmt = db.prepare("SELECT id, fullName, email, phone, profileImagePath, createdAt FROM Users WHERE id = ?");
const updateProfileStmt = db.prepare(
  "UPDATE Users SET fullName=@fullName, email=@email, phone=@phone, profileImagePath=@profileImagePath WHERE id=@id"
);
const updatePasswordStmt = db.prepare("UPDATE Users SET passwordHash=@passwordHash WHERE id=@id");
const getUserByIdStmt = db.prepare("SELECT * FROM Users WHERE id = ?");

async function signup(payload) {
  const existing = getUserByEmailStmt.get(payload.email);
  if (existing) throw new Error("Email is already registered.");

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const result = signupStmt.run({
    fullName: payload.fullName,
    email: payload.email,
    passwordHash
  });

  return getProfileStmt.get(result.lastInsertRowid);
}

async function login(payload) {
  const user = getUserByEmailStmt.get(payload.email);
  if (!user) throw new Error("Invalid credentials.");

  const ok = await bcrypt.compare(payload.password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials.");

  return getProfileStmt.get(user.id);
}

function getProfile(userId) {
  return getProfileStmt.get(userId);
}

async function updateProfile(payload) {
  const existing = getUserByEmailStmt.get(payload.email);
  if (existing && existing.id !== payload.id) {
    throw new Error("Email is already registered by another account.");
  }
  updateProfileStmt.run({
    id: payload.id,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || null,
    profileImagePath: payload.profileImagePath || null
  });
  return getProfile(payload.id);
}

async function changePassword(payload) {
  const user = getUserByIdStmt.get(payload.id);
  if (!user) throw new Error("User not found.");
  const valid = await bcrypt.compare(payload.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect.");
  const passwordHash = await bcrypt.hash(payload.newPassword, 10);
  updatePasswordStmt.run({ id: payload.id, passwordHash });
  return { changed: true };
}

module.exports = { signup, login, getProfile, updateProfile, changePassword };
