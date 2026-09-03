const { z } = require("zod");

const settingsSchema = z.object({
  company_name: z.string().trim().max(120).optional(),
  logo_url: z.string().trim().max(500).optional(),
  address: z.string().trim().max(400).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  currency: z.string().trim().max(8).optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
  invoice_prefix: z.string().trim().max(12).optional(),
  accent_color: z.string().trim().max(32).optional(),
});

module.exports = {
  settingsSchema,
};
