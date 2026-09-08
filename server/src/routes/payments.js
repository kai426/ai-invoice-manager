const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { idParam, paymentSchema } = require("../validators/paymentSchemas");
const {
  listPayments,
  createPayment,
  deletePayment,
} = require("../controllers/paymentController");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(listPayments));
router.post("/", validate(paymentSchema), asyncHandler(createPayment));
router.delete("/:id", validate(idParam, "params"), asyncHandler(deletePayment));

module.exports = router;
