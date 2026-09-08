const { z } = require("zod");
const { idParam } = require("../utils/helpers");

const clientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().or(z.literal("")).optional(),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(400).optional(),
  notes: z.string().trim().max(2000).optional(),
});

module.exports = {
  idParam,
  clientSchema,
};
