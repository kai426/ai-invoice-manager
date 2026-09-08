const { z } = require("zod");
const { dateStr, idParam, uuid } = require("../utils/helpers");

const paymentSchema = z.object({
  invoiceId: uuid,
  amount: z.coerce.number().min(0.01).max(100_000_000),
  method: z.string().trim().max(40).optional(),
  paid_on: dateStr,
  notes: z.string().trim().max(500).optional(),
});

module.exports = {
  idParam,
  paymentSchema,
};
