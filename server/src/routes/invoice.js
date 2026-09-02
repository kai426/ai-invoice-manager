const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  idParam,
  invoiceSchema,
  invoiceStatusSchema,
  invoiceUpdateSchema,
} = require("../validators/invoiceSchemas");
const {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} = require("../controllers/invoiceController");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(listInvoices));
router.get("/:id", validate(idParam, "params"), asyncHandler(getInvoice));
router.post("/", validate(invoiceSchema), asyncHandler(createInvoice));
router.patch(
  "/:id",
  validate(idParam, "params"),
  validate(invoiceUpdateSchema),
  asyncHandler(updateInvoice),
);
router.patch(
  "/:id/status",
  validate(idParam, "params"),
  validate(invoiceStatusSchema),
  asyncHandler(updateInvoiceStatus),
);
router.delete("/:id", validate(idParam, "params"), asyncHandler(deleteInvoice));

module.exports = router;