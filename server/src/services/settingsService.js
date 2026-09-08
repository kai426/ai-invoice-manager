const Settings = require("../models/Settings");

function getSettings(userId) {
  return Settings.ensure(userId);
}

function updateSettings(userId, payload) {
  return Settings.update(userId, payload);
}

module.exports = { getSettings, updateSettings };
