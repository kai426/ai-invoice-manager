const { z } = require("zod");
const { idParam } = require("../utils/helpers");

const itemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  rate: z.coerce.number().min(0).max(100_000_000),
  unit: z.string().trim().max(32).optional(),
});

module.exports = {
  idParam,
  itemSchema,
};
