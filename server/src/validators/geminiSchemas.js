const { z } = require("zod");
const { Type } = require("@google/genai");

const receiptResponseSchema = {
  type: Type.OBJECT,
  required: ["vendor", "total", "lineItems"],
  properties: {
    vendor: { type: Type.STRING, description: "Merchant / vendor name" },
    date: {
      type: Type.STRING,
      description: "ISO date YYYY-MM-DD if visible, else empty",
    },
    currency: {
      type: Type.STRING,
      description: "3-letter code like USD, else empty",
    },
    subtotal: { type: Type.NUMBER },
    tax: { type: Type.NUMBER },
    total: { type: Type.NUMBER },
    category: {
      type: Type.STRING,
      description: "Expense category e.g. Meals, Software, Travel",
    },
    notes: { type: Type.STRING },
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["description", "quantity", "rate"],
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          rate: {
            type: Type.NUMBER,
            description: "Unit price",
          },
        },
      },
    },
  },
};

const receiptValidator = z.object({
  vendor: z.string().default(""),
  date: z.string().default(""),
  currency: z.string().default(""),
  subtotal: z.number().default(0),
  tax: z.number().default(0),
  total: z.number().default(0),
  category: z.string().default(""),
  notes: z.string().default(""),
  lineItems: z
    .array(
      z.object({
        description: z.string().default(""),
        quantity: z.coerce.number().default(1),
        rate: z.coerce.number().default(0),
      }),
    )
    .default([]),
});

module.exports = {
  receiptResponseSchema,
  receiptValidator,
};
