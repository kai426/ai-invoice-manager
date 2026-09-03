const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { showReports } = require("../controllers/reportsController");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(showReports));

module.exports = router;
