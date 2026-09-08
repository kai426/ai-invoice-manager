const { issueSession, clearSession } = require("../services/sessionService");
const {
  authenticateUser,
  changeUserPassword,
  registerUser,
  updateUserProfile,
} = require("../services/authService");

async function register(req, res) {
  const user = await registerUser(req.body);
  issueSession(res, user);
  res.status(201).json({ user });
}

async function login(req, res) {
  const user = await authenticateUser(req.body);
  issueSession(res, user);
  res.json({ user });
}

function logout(req, res) {
  clearSession(res);
  res.json({ ok: true });
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res) {
  const user = await updateUserProfile(req.user.id, req.body);
  res.json({ user });
}

async function updatePassword(req, res) {
  await changeUserPassword(req.user.id, req.body);
  res.json({ ok: true });
}

module.exports = { login, logout, me, register, updatePassword, updateProfile };
