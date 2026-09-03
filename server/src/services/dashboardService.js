const { query, queryOne } = require("../config/db");
const { serializeInvoice } = require("../utils/invoice");

async function getDashboard(userId) {
  const totals = await queryOne(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS total_revenue,
       COALESCE(SUM(CASE WHEN status <> 'paid' THEN total ELSE 0 END), 0) AS outstanding,
       COALESCE(SUM(CASE WHEN status = 'paid'
         AND date_trunc('month', COALESCE(paid_at, issue_date))
           = date_trunc('month', CURRENT_DATE)
         THEN total ELSE 0 END), 0) AS paid_this_month,
       COUNT(*) FILTER (WHERE status = 'sent' AND due_date < CURRENT_DATE)::int AS overdue_count,
       COUNT(*)::int AS invoice_count,
       COALESCE(SUM(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN total ELSE 0 END), 0) AS overdue_total
     FROM invoices WHERE user_id = $1`,
    [userId],
  );

  const { rows: series } = await query(
    `WITH months AS (
       SELECT date_trunc('month', CURRENT_DATE) - (n || ' month')::interval AS m
       FROM generate_series(0, 5) n
     )
     SELECT to_char(months.m, 'Mon') AS label,
            to_char(months.m, 'YYYY-MM') AS ym,
            COALESCE(SUM(i.total), 0) AS revenue,
            COUNT(i.id)::int AS count
     FROM months
     LEFT JOIN invoices i
       ON i.user_id = $1
      AND i.status = 'paid'
      AND date_trunc('month', COALESCE(i.paid_at, i.issue_date)) = months.m
     GROUP BY months.m
     ORDER BY months.m ASC`,
    [userId],
  );

  const { rows: recentRows } = await query(
    `SELECT i.*, c.name AS client_name, c.company AS client_company
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.user_id = $1
     ORDER BY i.created_at DESC
     LIMIT 5`,
    [userId],
  );

  const clientCount = await queryOne(
    "SELECT COUNT(*)::int AS n FROM clients WHERE user_id = $1",
    [userId],
  );

  return {
    stats: {
      totalRevenue: Number(totals.total_revenue),
      outstanding: Number(totals.outstanding),
      paidThisMonth: Number(totals.paid_this_month),
      overdueCount: totals.overdue_count,
      overdueTotal: Number(totals.overdue_total),
      invoiceCount: totals.invoice_count,
      clientCount: clientCount.n,
    },
    revenueSeries: series.map((row) => ({
      label: row.label,
      ym: row.ym,
      revenue: Number(row.revenue),
      count: row.count,
    })),
    recentInvoices: recentRows.map((row) => serializeInvoice(row)),
  };
}

module.exports = { getDashboard };
