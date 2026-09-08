const { z } = require("zod");
const { dateStr, idParam, uuid } = require("../utils/helpers");

const itemSchema = z.object({
  description: z.string().trim().max(500).default(""),
  quantity: z.coerce.number().min(0).max(1_000_000).default(1),
  rate: z.coerce.number().min(0).max(100_000_000).default(0),
});

const invoiceSchema = z.object({
  client_id: uuid.nullish(),
  invoice_number: z.string().trim().max(40).optional(),
  status: z.enum(["draft", "sent", "paid"]).default("draft"),
  issue_date: dateStr,
  due_date: dateStr,
  currency: z.string().trim().max(8).default("USD"),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).max(100_000_000).default(0),
  notes: z.string().trim().max(4000).default(""),
  terms: z.string().trim().max(2000).default(""),
  items: z.array(itemSchema).default([]),
});

const invoiceUpdateSchema = invoiceSchema.partial();

const invoiceStatusSchema = z.object({
  status: z.enum(["draft", "sent", "paid"]),
});

module.exports = {
  idParam,
  invoiceSchema,
  invoiceStatusSchema,
  invoiceUpdateSchema,
};
