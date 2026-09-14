const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimit");
const { uploadReceipt } = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const {
  paymentReminderSchema,
  writeNoteSchema,
} = require("../validators/aiSchemas");
const {
  createReminder,
  getBusinessSummary,
  parseReceiptUpload,
  writeInvoiceNote,
} = require("../controllers/aiController");

const router = express.Router();

router.use(requireAuth);

router.post(
  "/receipt-parse",
  aiLimiter,
  uploadReceipt("file"),
  asyncHandler(parseReceiptUpload),
);
router.post("/business-summary", aiLimiter, asyncHandler(getBusinessSummary));
router.post(
  "/payment-reminder",
  aiLimiter,
  validate(paymentReminderSchema),
  asyncHandler(createReminder),
);
router.post(
  "/write-note",
  aiLimiter,
  validate(writeNoteSchema),
  asyncHandler(writeInvoiceNote),
);

module.exports = router;
