const Settings = require("../models/Settings");

async function getSettings(req, res) {
  const settings = await Settings.ensure(req.user.id);
  res.json({ settings });
}

async function updateSettings(req, res) {
  const settings = await Settings.update(req.user.id, req.body);
  res.json({ settings });
}

module.exports = {
  getSettings,
  updateSettings,
};
