const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { idParam, expenseSchema } = require("../validators/expenseSchemas");
const {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(listExpenses));
router.post("/", validate(expenseSchema), asyncHandler(createExpense));
router.patch(
  "/:id",
  validate(idParam, "params"),
  validate(expenseSchema.partial()),
  asyncHandler(updateExpense),
);
router.delete("/:id", validate(idParam, "params"), asyncHandler(deleteExpense));

module.exports = router;
