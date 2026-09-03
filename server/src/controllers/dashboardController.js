const { getDashboard } = require("../services/dashboardService");

async function showDashboard(req, res) {
  const dashboard = await getDashboard(req.user.id);
  res.json(dashboard);
}

module.exports = { showDashboard };
