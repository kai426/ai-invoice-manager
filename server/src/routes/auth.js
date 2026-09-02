const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const {
  registerSchema,
  loginSchema,
  profileSchema,
  passwordSchema,
} = require("../validators/authSchemas");
const {
  register,
  login,
  logout,
  me,
  updateProfile,
  updatePassword,
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(register),
);

router.post("/login", authLimiter, validate(loginSchema), asyncHandler(login));

router.post("/logout", logout);

router.get("/me", requireAuth, asyncHandler(me));

router.patch(
  "/profile",
  requireAuth,
  validate(profileSchema),
  asyncHandler(updateProfile),
);

router.patch(
  "/password",
  authLimiter,
  requireAuth,
  validate(passwordSchema),
  asyncHandler(updatePassword),
);

module.exports = router;
