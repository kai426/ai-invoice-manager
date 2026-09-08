const {
  getSettings: getSettingsRecord,
  updateSettings: updateSettingsRecord,
} = require("../services/settingsService");

async function getSettings(req, res) {
  const settings = await getSettingsRecord(req.user.id);
  res.json({ settings });
}

async function updateSettings(req, res) {
  const settings = await updateSettingsRecord(req.user.id, req.body);
  res.json({ settings });
}

module.exports = { getSettings, updateSettings };
