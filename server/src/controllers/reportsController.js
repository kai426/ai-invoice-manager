const { getReports } = require("../services/reportsService");

async function showReports(req, res) {
  const reports = await getReports(req.user.id);
  res.json(reports);
}

module.exports = { showReports };
