const ApiError = require("../utils/ApiError");
const { query, queryOne } = require("../config/db");

async function createItem(req, res) {
  const b = req.body;
  const item = await queryOne(
    `INSERT INTO catalog_items (user_id, name, description, rate, unit)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, b.name, b.description || "", b.rate, b.unit || ""],
  );

  res.status(201).json({ item: { ...item, rate: Number(item.rate) } });
}

async function updateItem(req, res) {
  const fields = ["name", "description", "rate", "unit"];
  const sets = [];
  const values = [req.params.id, req.user.id];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      values.push(req.body[f]);
      sets.push(`${f} = $${values.length}`);
    }
  }

  if (!sets.length) throw ApiError.badRequest("No fields to update");

  const item = await queryOne(
    `UPDATE catalog_items SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    values,
  );

  if (!item) throw ApiError.notFound("Item not found");
  res.json({ item: { ...item, rate: Number(item.rate) } });
}

async function deleteItem(req, res) {
  const r = await query(
    "DELETE FROM catalog_items WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id],
  );

  if (!r.rowCount) throw ApiError.notFound("Item not found");
  res.json({ ok: true });
}

module.exports = {
  createItem,
  updateItem,
  deleteItem,
};
