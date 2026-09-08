const ApiError = require("../utils/ApiError");
const { query, queryOne } = require("../config/db");
const { buildUpdateFields, numberOrZero } = require("../utils/helpers");

const CLIENT_FIELDS = ["name", "email", "company", "phone", "address", "notes"];

async function listClients(userId) {
  const { rows } = await query(
    `SELECT c.*, COUNT(i.id)::int AS invoice_count,
            COALESCE(SUM(i.total), 0) AS total_billed,
            COALESCE(SUM(CASE WHEN i.status <> 'paid' THEN i.total ELSE 0 END), 0) AS outstanding
     FROM clients c LEFT JOIN invoices i ON i.client_id = c.id
     WHERE c.user_id = $1 GROUP BY c.id ORDER BY c.created_at DESC`,
    [userId],
  );

  return rows.map((client) => ({
    ...client,
    total_billed: numberOrZero(client.total_billed),
    outstanding: numberOrZero(client.outstanding),
  }));
}

async function getClient(userId, clientId) {
  const client = await queryOne(
    "SELECT * FROM clients WHERE id = $1 AND user_id = $2",
    [clientId, userId],
  );
  if (!client) throw ApiError.notFound("Client not found");

  const { rows } = await query(
    `SELECT id, invoice_number, status, issue_date, due_date, total, currency, created_at
     FROM invoices WHERE client_id = $1 AND user_id = $2
     ORDER BY issue_date DESC, created_at DESC`,
    [clientId, userId],
  );
  const invoices = rows.map((invoice) => ({
    ...invoice,
    total: numberOrZero(invoice.total),
  }));
  const totalBilled = invoices.reduce(
    (total, invoice) => total + invoice.total,
    0,
  );
  const outstanding = invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((total, invoice) => total + invoice.total, 0);

  return {
    client,
    invoices,
    stats: { totalBilled, outstanding, count: invoices.length },
  };
}

async function createClient(userId, payload) {
  return queryOne(
    `INSERT INTO clients (user_id, name, email, company, phone, address, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      userId,
      payload.name,
      payload.email || "",
      payload.company || "",
      payload.phone || "",
      payload.address || "",
      payload.notes || "",
    ],
  );
}

async function updateClient(userId, clientId, payload) {
  const { sets, values } = buildUpdateFields(payload, CLIENT_FIELDS, [
    clientId,
    userId,
  ]);
  if (!sets.length) throw ApiError.badRequest("Nenhum campo para atualizar");

  const client = await queryOne(
    `UPDATE clients SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    values,
  );
  if (!client) throw ApiError.notFound("Cliente não encontrado");
  return client;
}

async function deleteClient(userId, clientId) {
  const result = await query(
    "DELETE FROM clients WHERE id = $1 AND user_id = $2",
    [clientId, userId],
  );
  if (!result.rowCount) throw ApiError.notFound("Client not found");
}

module.exports = {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient,
};
