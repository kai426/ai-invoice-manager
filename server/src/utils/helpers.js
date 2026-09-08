const { z } = require("zod");

const uuid = z.string().uuid("Invalid id");
const idParam = z.object({ id: uuid });
const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional();

function numberOrZero(value) {
  return Number(value) || 0;
}

function serializeNumberField(record, field) {
  return { ...record, [field]: numberOrZero(record[field]) };
}

function buildUpdateFields(payload, fields, initialValues) {
  const sets = [];
  const values = [...initialValues];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      values.push(payload[field]);
      sets.push(`${field} = $${values.length}`);
    }
  }

  return { sets, values };
}

module.exports = {
  buildUpdateFields,
  dateStr,
  idParam,
  numberOrZero,
  serializeNumberField,
  uuid,
};
