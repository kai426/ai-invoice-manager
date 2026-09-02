const ApiError = require("../utils/ApiError");
const { query, queryOne, withTransaction } = require("../config/db");
const Settings = require("../models/Settings");
const { computeTotals, serializeInvoice } = require("../utils/invoice");

async function loadInvoice(userId, id) {
  const invoice = await queryOne(
    `SELECT i.*, c.name AS client_name, c.email AS client_email,
            c.company AS client_company, c.address AS client_address
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, userId],
  );

  if (!invoice) throw ApiError.notFound("Fatura não encontrada");

  const { rows: items } = await query(
    `SELECT id, description, quantity, rate, amount, position
     FROM invoice_items WHERE invoice_id = $1 ORDER BY position ASC`,
    [id],
  );

  return serializeInvoice(invoice, items);
}

async function replaceItems(client, invoiceId, items) {
  await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [
    invoiceId,
  ]);

  for (const item of items) {
    await client.query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount, position)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        invoiceId,
        item.description,
        item.quantity,
        item.rate,
        item.amount,
        item.position,
      ],
    );
  }
}

function resolveSortColumn(sort) {
  return (
    {
      issue_date: "i.issue_date",
      total: "i.total",
      due_date: "i.due_date",
      created_at: "i.created_at",
    }[sort] || "i.issue_date"
  );
}

async function listInvoices(userId, filters = {}) {
  const {
    status,
    client_id: clientId,
    search,
    sort = "issue_date",
    order = "desc",
  } = filters;

  const params = [userId];
  const where = ["i.user_id = $1"];

  if (clientId) {
    params.push(clientId);
    where.push(`i.client_id = $${params.length}`);
  }

  if (status && status !== "all") {
    if (status === "overdue") {
      where.push(`i.status = 'sent' AND i.due_date < CURRENT_DATE`);
    } else if (status === "sent") {
      where.push(
        `i.status = 'sent' AND (i.due_date IS NULL OR i.due_date >= CURRENT_DATE)`,
      );
    } else {
      params.push(status);
      where.push(`i.status = $${params.length}`);
    }
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(
      `(i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`,
    );
  }

  const sortCol = resolveSortColumn(sort);
  const sortDir = order === "asc" ? "ASC" : "DESC";

  const { rows } = await query(
    `SELECT i.*, c.name AS client_name, c.company AS client_company
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE ${where.join(" AND ")}
     ORDER BY ${sortCol} ${sortDir}, i.created_at DESC`,
    params,
  );

  return rows.map((row) => serializeInvoice(row));
}

async function createInvoice(userId, payload) {
  const totals = computeTotals(payload.items, payload.tax_rate, payload.discount);
  const invoiceNumber =
    payload.invoice_number || (await Settings.nextInvoiceNumber(userId));

  const invoice = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO invoices
        (user_id, client_id, invoice_number, status, issue_date, due_date,
         currency, tax_rate, discount, subtotal, tax_amount, total, notes, terms, paid_at)
       VALUES ($1,$2,$3,$4,COALESCE($5, CURRENT_DATE),$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        userId,
        payload.client_id || null,
        invoiceNumber,
        payload.status,
        payload.issue_date || null,
        payload.due_date || null,
        payload.currency,
        payload.tax_rate,
        totals.discount,
        totals.subtotal,
        totals.taxAmount,
        totals.total,
        payload.notes,
        payload.terms,
        payload.status === "paid" ? new Date() : null,
      ],
    );

    await replaceItems(client, rows[0].id, totals.items);
    return rows[0];
  });

  return loadInvoice(userId, invoice.id);
}

async function updateInvoice(userId, id, payload) {
  const existing = await queryOne(
    "SELECT * FROM invoices WHERE id = $1 AND user_id = $2",
    [id, userId],
  );

  if (!existing) throw ApiError.notFound("Invoice not found");

  const taxRate = payload.tax_rate ?? Number(existing.tax_rate);
  const discount = payload.discount ?? Number(existing.discount);

  await withTransaction(async (client) => {
    let totals = null;

    if (payload.items) {
      totals = computeTotals(payload.items, taxRate, discount);
    } else if (
      payload.tax_rate !== undefined ||
      payload.discount !== undefined
    ) {
      const { rows: currentItems } = await client.query(
        "SELECT description, quantity, rate FROM invoice_items WHERE invoice_id = $1 ORDER BY position",
        [existing.id],
      );

      totals = computeTotals(currentItems, taxRate, discount);
    }

    const sets = [];
    const values = [existing.id];
    const setValue = (column, value) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    if (payload.client_id !== undefined) {
      setValue("client_id", payload.client_id || null);
    }

    if (payload.invoice_number !== undefined) {
      setValue("invoice_number", payload.invoice_number);
    }

    if (payload.status !== undefined) {
      setValue("status", payload.status);
      setValue("paid_at", payload.status === "paid" ? new Date() : null);
    }

    if (payload.issue_date !== undefined) {
      setValue("issue_date", payload.issue_date);
    }

    if (payload.due_date !== undefined) {
      setValue("due_date", payload.due_date);
    }

    if (payload.currency !== undefined) {
      setValue("currency", payload.currency);
    }

    if (payload.notes !== undefined) {
      setValue("notes", payload.notes);
    }

    if (payload.terms !== undefined) {
      setValue("terms", payload.terms);
    }

    if (totals) {
      setValue("tax_rate", taxRate);
      setValue("discount", totals.discount);
      setValue("subtotal", totals.subtotal);
      setValue("tax_amount", totals.taxAmount);
      setValue("total", totals.total);
    }

    if (sets.length) {
      await client.query(
        `UPDATE invoices SET ${sets.join(", ")}, updated_at = now() WHERE id = $1`,
        values,
      );
    }

    if (totals && payload.items) {
      await replaceItems(client, existing.id, totals.items);
    }
  });

  return loadInvoice(userId, existing.id);
}

async function updateInvoiceStatus(userId, id, status) {
  const updated = await queryOne(
    `UPDATE invoices
     SET status = $3, paid_at = $4, updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId, status, status === "paid" ? new Date() : null],
  );

  if (!updated) throw ApiError.notFound("Invoice not found");

  return loadInvoice(userId, id);
}

async function deleteInvoice(userId, id) {
  const result = await query(
    "DELETE FROM invoices WHERE id = $1 AND user_id = $2",
    [id, userId],
  );

  if (!result.rowCount) throw ApiError.notFound("Invoice not found");
}

module.exports = {
  createInvoice,
  deleteInvoice,
  listInvoices,
  loadInvoice,
  updateInvoice,
  updateInvoiceStatus,
};
