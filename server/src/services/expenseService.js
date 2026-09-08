const ApiError = require("../utils/ApiError");
const { query, queryOne } = require("../config/db");
const {
  buildUpdateFields,
  numberOrZero,
  serializeNumberField,
} = require("../utils/helpers");

const EXPENSE_FIELDS = [
  "vendor",
  "category",
  "expense_date",
  "amount",
  "currency",
  "notes",
];

async function listExpenses(userId, filters) {
  const params = [userId];
  const where = ["user_id = $1"];
  if (filters.category && filters.category !== "all") {
    params.push(filters.category);
    where.push(`category = $${params.length}`);
  }
  if (filters.month) {
    params.push(`${filters.month}-01`);
    where.push(
      `date_trunc('month', expense_date) = date_trunc('month', $${params.length}::date)`,
    );
  }

  const { rows: expenses } = await query(
    `SELECT * FROM expenses WHERE ${where.join(" AND ")} ORDER BY expense_date DESC, created_at DESC`,
    params,
  );
  const totals = await queryOne(
    `SELECT COALESCE(SUM(amount), 0) AS total,
            COALESCE(SUM(CASE WHEN date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS this_month
     FROM expenses WHERE user_id = $1`,
    [userId],
  );
  const { rows: categories } = await query(
    "SELECT DISTINCT category FROM expenses WHERE user_id = $1 AND category <> '' ORDER BY category",
    [userId],
  );

  return {
    expenses: expenses.map((expense) =>
      serializeNumberField(expense, "amount"),
    ),
    totals: {
      total: numberOrZero(totals.total),
      thisMonth: numberOrZero(totals.this_month),
    },
    categories: categories.map((category) => category.category),
  };
}

async function createExpense(userId, payload) {
  const expense = await queryOne(
    `INSERT INTO expenses (user_id, vendor, category, expense_date, amount, currency, notes)
     VALUES ($1,$2,$3,COALESCE($4, CURRENT_DATE),$5,$6,$7) RETURNING *`,
    [
      userId,
      payload.vendor || "",
      payload.category || "General",
      payload.expense_date || null,
      payload.amount,
      payload.currency || "USD",
      payload.notes || "",
    ],
  );
  return serializeNumberField(expense, "amount");
}

async function updateExpense(userId, expenseId, payload) {
  const { sets, values } = buildUpdateFields(payload, EXPENSE_FIELDS, [
    expenseId,
    userId,
  ]);
  if (!sets.length) throw ApiError.badRequest("No fields to update");

  const expense = await queryOne(
    `UPDATE expenses SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    values,
  );
  if (!expense) throw ApiError.notFound("Expense not found");
  return serializeNumberField(expense, "amount");
}

async function deleteExpense(userId, expenseId) {
  const result = await query(
    "DELETE FROM expenses WHERE id = $1 AND user_id = $2",
    [expenseId, userId],
  );
  if (!result.rowCount) throw ApiError.notFound("Expense not found");
}

module.exports = { createExpense, deleteExpense, listExpenses, updateExpense };
