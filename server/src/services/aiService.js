const ApiError = require("../utils/ApiError");
const { query, queryOne } = require("../config/db");
const Settings = require("../models/Settings");
const gemini = require("./geminiService");

async function parseReceipt(file) {
  return gemini.parseReceipt({ buffer: file.buffer, mimeType: file.mimetype });
}

async function createBusinessSummary(userId) {
  const totals = await queryOne(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'paid'
         AND date_trunc('month', COALESCE(paid_at, issue_date)) = date_trunc('month', CURRENT_DATE)
         THEN total ELSE 0 END), 0) AS revenue_this_month,
       COALESCE(SUM(CASE WHEN status = 'paid'
         AND date_trunc('month', COALESCE(paid_at, issue_date)) = date_trunc('month', CURRENT_DATE - interval '1 month')
         THEN total ELSE 0 END), 0) AS revenue_last_month,
       COALESCE(SUM(CASE WHEN status <> 'paid' THEN total ELSE 0 END), 0) AS outstanding,
       COUNT(*) FILTER (WHERE status = 'sent' AND due_date < CURRENT_DATE)::int AS overdue_count,
       COALESCE(SUM(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN total ELSE 0 END), 0) AS overdue_total
     FROM invoices WHERE user_id = $1`,
    [userId],
  );

  const { rows: topOverdue } = await query(
    `SELECT c.name AS client, i.invoice_number, i.total,
            (CURRENT_DATE - i.due_date) AS days_overdue
     FROM invoices i LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.user_id = $1 AND i.status = 'sent' AND i.due_date < CURRENT_DATE
     ORDER BY i.total DESC LIMIT 3`,
    [userId],
  );

  const data = {
    revenueThisMonth: Number(totals.revenue_this_month),
    revenueLastMonth: Number(totals.revenue_last_month),
    outstanding: Number(totals.outstanding),
    overdueCount: totals.overdue_count,
    overdueTotal: Number(totals.overdue_total),
    topOverdue: topOverdue.map((invoice) => ({
      client: invoice.client,
      invoice: invoice.invoice_number,
      amount: Number(invoice.total),
      daysOverdue: Number(invoice.days_overdue),
    })),
  };

  const summary = await gemini.businessSummary(data);
  return { summary, data };
}

async function createPaymentReminder(userId, userName, payload) {
  const invoice = await queryOne(
    `SELECT i.*, c.name AS client_name, c.email AS client_email, c.company AS client_company
     FROM invoices i LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [payload.invoiceId, userId],
  );
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const settings = await Settings.ensure(userId);
  const daysOverdue = invoice.due_date
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(invoice.due_date).getTime()) / 86_400_000,
        ),
      )
    : 0;

  const draft = await gemini.paymentReminder({
    tone: payload.tone,
    invoice: {
      number: invoice.invoice_number,
      total: Number(invoice.total),
      currency: invoice.currency,
      dueDate: invoice.due_date,
    },
    client: { name: invoice.client_name, company: invoice.client_company },
    company: { name: settings.company_name || userName },
    daysOverdue,
  });

  return { ...draft, meta: { daysOverdue, to: invoice.client_email } };
}

async function createInvoiceNote(payload) {
  return gemini.writeNote(payload);
}

module.exports = {
  createBusinessSummary,
  createInvoiceNote,
  createPaymentReminder,
  parseReceipt,
};
