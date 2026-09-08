const { z } = require("zod");
const { dateStr, idParam } = require("../utils/helpers");

const expenseSchema = z.object({
  vendor: z.string().trim().max(160).optional(),
  category: z.string().trim().max(60).optional(),
  expense_date: dateStr,
  amount: z.coerce.number().min(0).max(100_000_000).default(0),
  currency: z.string().trim().max(8).optional(),
  notes: z.string().trim().max(1000).optional(),
});

module.exports = {
  idParam,
  expenseSchema,
};
