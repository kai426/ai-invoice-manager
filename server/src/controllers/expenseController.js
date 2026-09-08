const {
  createExpense: createExpenseRecord,
  deleteExpense: deleteExpenseRecord,
  listExpenses: listExpenseRecords,
  updateExpense: updateExpenseRecord,
} = require("../services/expenseService");

async function listExpenses(req, res) {
  res.json(await listExpenseRecords(req.user.id, req.query));
}

async function createExpense(req, res) {
  const expense = await createExpenseRecord(req.user.id, req.body);
  res.status(201).json({ expense });
}

async function updateExpense(req, res) {
  const expense = await updateExpenseRecord(req.user.id, req.params.id, req.body);
  res.json({ expense });
}

async function deleteExpense(req, res) {
  await deleteExpenseRecord(req.user.id, req.params.id);
  res.json({ ok: true });
}

module.exports = { createExpense, deleteExpense, listExpenses, updateExpense };
