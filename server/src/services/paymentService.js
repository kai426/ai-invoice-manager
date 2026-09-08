const ApiError = require("../utils/ApiError");
const { query, queryOne, withTransaction } = require("../config/db");
const { numberOrZero, serializeNumberField } = require("../utils/helpers");

async function listPayments(userId) {
  const { rows } = await query(
    `SELECT p.*, i.invoice_number, i.total AS invoice_total, c.name AS client_name
     FROM payments p JOIN invoices i ON i.id = p.invoice_id
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE p.user_id = $1 ORDER BY p.paid_on DESC, p.created_at DESC`,
    [userId],
  );
  const totals = await queryOne(
    `SELECT COALESCE(SUM(amount), 0) AS total,
            COALESCE(SUM(CASE WHEN date_trunc('month', paid_on) = date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS this_month
     FROM payments WHERE user_id = $1`,
    [userId],
  );

  return {
    payments: rows.map((payment) => ({
      ...serializeNumberField(payment, "amount"),
      invoice_total: numberOrZero(payment.invoice_total),
    })),
    totals: {
      total: numberOrZero(totals.total),
      thisMonth: numberOrZero(totals.this_month),
    },
  };
}

async function createPayment(userId, payload) {
  const invoice = await queryOne(
    "SELECT id FROM invoices WHERE id = $1 AND user_id = $2",
    [payload.invoiceId, userId],
  );
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const payment = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO payments (user_id, invoice_id, amount, method, paid_on, notes)
       VALUES ($1,$2,$3,$4,COALESCE($5, CURRENT_DATE),$6) RETURNING *`,
      [
        userId,
        payload.invoiceId,
        payload.amount,
        payload.method || "",
        payload.paid_on || null,
        payload.notes || "",
      ],
    );
    await reconcileInvoice(client, payload.invoiceId);
    return rows[0];
  });

  return serializeNumberField(payment, "amount");
}

async function deletePayment(userId, paymentId) {
  const existing = await queryOne(
    "SELECT invoice_id FROM payments WHERE id = $1 AND user_id = $2",
    [paymentId, userId],
  );
  if (!existing) throw ApiError.notFound("Payment not found");

  await withTransaction(async (client) => {
    await client.query("DELETE FROM payments WHERE id = $1", [paymentId]);
    await reconcileInvoice(client, existing.invoice_id);
  });
}

async function reconcileInvoice(client, invoiceId) {
  const { rows } = await client.query(
    `SELECT i.total, COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) AS paid
     FROM invoices i WHERE i.id = $1`,
    [invoiceId],
  );
  if (!rows[0]) return;

  const { total, paid } = rows[0];
  if (numberOrZero(paid) >= numberOrZero(total) && numberOrZero(total) > 0) {
    await client.query(
      `UPDATE invoices SET status = 'paid', paid_at = COALESCE(paid_at, now()), updated_at = now()
       WHERE id = $1`,
      [invoiceId],
    );
    return;
  }

  await client.query(
    `UPDATE invoices
     SET status = CASE WHEN status = 'paid' THEN 'sent' ELSE status END,
         paid_at = CASE WHEN status = 'paid' THEN NULL ELSE paid_at END,
         updated_at = now()
     WHERE id = $1`,
    [invoiceId],
  );
}

module.exports = {
  createPayment,
  deletePayment,
  listPayments,
  reconcileInvoice,
};
