const { z } = require("zod");
const { uuid } = require("../utils/helpers");

const paymentReminderSchema = z.object({
  invoiceId: uuid,
  tone: z.enum(["friendly", "firm", "final"]).default("friendly"),
});

const writeNoteSchema = z.object({
  kind: z.enum(["description", "terms"]).default("description"),
  prompt: z.string().trim().max(600).optional(),
  items: z
    .array(
      z.object({
        description: z.string().optional(),
        quantity: z.coerce.number().optional(),
        rate: z.coerce.number().optional(),
      }),
    )
    .optional(),
  client: z.object({ name: z.string().optional() }).partial().optional(),
});

module.exports = { paymentReminderSchema, writeNoteSchema };
