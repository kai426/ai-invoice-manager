const { query, queryOne } = require("../config/db");

const numberOrZero = (value) => Number(value) || 0;

async function getReports(userId) {
  const totals = await queryOne(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS revenue,
       COALESCE(SUM(CASE WHEN status <> 'paid' THEN total ELSE 0 END), 0) AS outstanding,
       COUNT(*)::int AS invoice_count
     FROM invoices WHERE user_id = $1`,
    [userId],
  );

  const expensesResult = await queryOne(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = $1",
    [userId],
  );

  const { rows: monthly } = await query(
    `WITH months AS (
       SELECT date_trunc('month', CURRENT_DATE) - (n || ' month')::interval AS m
       FROM generate_series(0, 5) n
     )
     SELECT to_char(months.m, 'Mon') AS label, to_char(months.m, 'YYYY-MM') AS ym,
            COALESCE((SELECT SUM(i.total) FROM invoices i
              WHERE i.user_id = $1 AND i.status = 'paid'
                AND date_trunc('month', COALESCE(i.paid_at, i.issue_date)) = months.m), 0) AS revenue,
            COALESCE((SELECT SUM(e.amount) FROM expenses e
              WHERE e.user_id = $1 AND date_trunc('month', e.expense_date) = months.m), 0) AS expenses
     FROM months ORDER BY months.m ASC`,
    [userId],
  );

  const aging = await queryOne(
    `SELECT
       COALESCE(SUM(CASE WHEN due_date IS NULL OR due_date >= CURRENT_DATE THEN total ELSE 0 END), 0) AS current,
       COALESCE(SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30 THEN total ELSE 0 END), 0) AS d30,
       COALESCE(SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 THEN total ELSE 0 END), 0) AS d60,
       COALESCE(SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 THEN total ELSE 0 END), 0) AS d90,
       COALESCE(SUM(CASE WHEN CURRENT_DATE - due_date > 90 THEN total ELSE 0 END), 0) AS d90plus
     FROM invoices WHERE user_id = $1 AND status = 'sent'`,
    [userId],
  );

  const { rows: topClients } = await query(
    `SELECT c.id, c.name,
            COALESCE(SUM(i.total), 0) AS billed,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) AS paid
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id ORDER BY billed DESC LIMIT 5`,
    [userId],
  );

  const status = await queryOne(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'draft' THEN total ELSE 0 END), 0) AS draft,
       COALESCE(SUM(CASE WHEN status = 'sent' AND (due_date IS NULL OR due_date >= CURRENT_DATE) THEN total ELSE 0 END), 0) AS sent,
       COALESCE(SUM(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN total ELSE 0 END), 0) AS overdue,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS paid
     FROM invoices WHERE user_id = $1`,
    [userId],
  );

  const revenue = numberOrZero(totals.revenue);
  const expenses = numberOrZero(expensesResult.total);

  return {
    totals: {
      revenue,
      expenses,
      netProfit: Math.round((revenue - expenses) * 100) / 100,
      outstanding: numberOrZero(totals.outstanding),
      invoiceCount: totals.invoice_count,
    },
    monthly: monthly.map((month) => ({
      label: month.label,
      ym: month.ym,
      revenue: numberOrZero(month.revenue),
      expenses: numberOrZero(month.expenses),
    })),
    aging: [
      { bucket: "current", value: numberOrZero(aging.current) },
      { bucket: "1-30", value: numberOrZero(aging.d30) },
      { bucket: "31-60", value: numberOrZero(aging.d60) },
      { bucket: "61-90", value: numberOrZero(aging.d90) },
      { bucket: "90+", value: numberOrZero(aging.d90plus) },
    ],
    topClients: topClients.map((client) => ({
      id: client.id,
      name: client.name,
      billed: numberOrZero(client.billed),
      paid: numberOrZero(client.paid),
    })),
    statusBreakdown: [
      { name: "Draft", value: numberOrZero(status.draft), key: "draft" },
      { name: "Sent", value: numberOrZero(status.sent), key: "sent" },
      { name: "Overdue", value: numberOrZero(status.overdue), key: "overdue" },
      { name: "Paid", value: numberOrZero(status.paid), key: "paid" },
    ],
  };
}

module.exports = { getReports };
