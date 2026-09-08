const ApiError = require("../utils/ApiError");
const { query, queryOne } = require("../config/db");
const { buildUpdateFields, serializeNumberField } = require("../utils/helpers");

const ITEM_FIELDS = ["name", "description", "rate", "unit"];

async function createItem(userId, payload) {
  const item = await queryOne(
    `INSERT INTO catalog_items (user_id, name, description, rate, unit)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [
      userId,
      payload.name,
      payload.description || "",
      payload.rate,
      payload.unit || "",
    ],
  );
  return serializeNumberField(item, "rate");
}

async function updateItem(userId, itemId, payload) {
  const { sets, values } = buildUpdateFields(payload, ITEM_FIELDS, [
    itemId,
    userId,
  ]);
  if (!sets.length) throw ApiError.badRequest("No fields to update");

  const item = await queryOne(
    `UPDATE catalog_items SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    values,
  );
  if (!item) throw ApiError.notFound("Item not found");
  return serializeNumberField(item, "rate");
}

async function deleteItem(userId, itemId) {
  const result = await query(
    "DELETE FROM catalog_items WHERE id = $1 AND user_id = $2",
    [itemId, userId],
  );
  if (!result.rowCount) throw ApiError.notFound("Item not found");
}

module.exports = { createItem, deleteItem, updateItem };
