const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { settingsSchema } = require("../validators/settingsSchemas");
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(getSettings));

router.patch("/", validate(settingsSchema), asyncHandler(updateSettings));

module.exports = router;
