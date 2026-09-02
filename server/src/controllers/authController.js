const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const Settings = require("../models/Settings");
const { issueSession, clearSession } = require("../services/sessionService");

async function register(req, res) {
  const { name, email, password, companyName, address } = req.body;

  const existing = await User.findByEmail(email);
  if (existing) throw ApiError.conflict("Esse e-mail já está em uso");

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  await Settings.ensure(user.id);
  if (companyName || address) {
    await Settings.update(user.id, {
      company_name: companyName || "",
      address: address || "",
      email,
    });
  }

  issueSession(res, user);
  res.status(201).json({ user });
}

async function login(req, res) {
  const { email, password } = req.body;

  const record = await User.findByEmail(email);
  if (!record) throw ApiError.unauthorized("Credenciais inválidas");

  const ok = await User.comparePassword(password, record.password_hash);
  if (!ok) throw ApiError.unauthorized("Credenciais inválidas");

  const user = {
    id: record.id,
    email: record.email,
    name: record.name,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };

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
  const user = await User.updateName(req.user.id, req.body.name);
  res.json({ user });
}

async function updatePassword(req, res) {
  const record = await User.findByIdWithHash(req.user.id);
  if (!record) throw ApiError.unauthorized("Sessão não é mais válida");

  const ok = await User.comparePassword(
    req.body.currentPassword,
    record.password_hash,
  );
  if (!ok) throw ApiError.unauthorized("Senha incorreta");

  const passwordHash = await User.hashPassword(req.body.newPassword);
  await User.updatePassword(req.user.id, passwordHash);
  res.json({ ok: true });
}

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
  updatePassword,
};
