const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { idParam, itemSchema } = require("../validators/itemSchemas");
const {
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");

const router = express.Router();

router.use(requireAuth);

router.post("/", validate(itemSchema), asyncHandler(createItem));

router.patch(
  "/:id",
  validate(idParam, "params"),
  validate(itemSchema.partial()),
  asyncHandler(updateItem),
);

router.delete("/:id", validate(idParam, "params"), asyncHandler(deleteItem));

module.exports = router;
