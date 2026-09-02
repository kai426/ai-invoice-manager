const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { idParam, clientSchema } = require("../validators/clientSchemas");
const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(listClients));
router.get("/:id", validate(idParam, "params"), asyncHandler(getClient));
router.post("/", validate(clientSchema), asyncHandler(createClient));
router.patch(
  "/:id",
  validate(idParam, "params"),
  validate(clientSchema.partial()),
  asyncHandler(updateClient),
);
router.delete("/:id", validate(idParam, "params"), asyncHandler(deleteClient));

module.exports = router;
