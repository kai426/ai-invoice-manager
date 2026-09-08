const {
  createItem: createItemRecord,
  deleteItem: deleteItemRecord,
  updateItem: updateItemRecord,
} = require("../services/itemService");

async function createItem(req, res) {
  const item = await createItemRecord(req.user.id, req.body);
  res.status(201).json({ item });
}

async function updateItem(req, res) {
  const item = await updateItemRecord(req.user.id, req.params.id, req.body);
  res.json({ item });
}

async function deleteItem(req, res) {
  await deleteItemRecord(req.user.id, req.params.id);
  res.json({ ok: true });
}

module.exports = { createItem, deleteItem, updateItem };
