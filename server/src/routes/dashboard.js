const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { showDashboard } = require("../controllers/dashboardController");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(showDashboard));

module.exports = router;
