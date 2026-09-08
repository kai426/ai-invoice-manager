const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const Settings = require("../models/Settings");

async function registerUser(payload) {
  const { name, email, password, companyName, address } = payload;
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

  return user;
}

async function authenticateUser({ email, password }) {
  const record = await User.findByEmail(email);
  if (!record) throw ApiError.unauthorized("Credenciais inválidas");

  const validPassword = await User.comparePassword(
    password,
    record.password_hash,
  );
  if (!validPassword) throw ApiError.unauthorized("Credenciais inválidas");

  return {
    id: record.id,
    email: record.email,
    name: record.name,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

async function updateUserProfile(userId, { name }) {
  return User.updateName(userId, name);
}

async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const record = await User.findByIdWithHash(userId);
  if (!record) throw ApiError.unauthorized("Sessão não é mais válida");

  const validPassword = await User.comparePassword(
    currentPassword,
    record.password_hash,
  );
  if (!validPassword) throw ApiError.unauthorized("Senha incorreta");

  const passwordHash = await User.hashPassword(newPassword);
  await User.updatePassword(userId, passwordHash);
}

module.exports = {
  authenticateUser,
  changeUserPassword,
  registerUser,
  updateUserProfile,
};
