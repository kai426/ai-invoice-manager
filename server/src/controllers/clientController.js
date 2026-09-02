const ApiError = require("../utils/ApiError");
const { query, queryOne } = require("../config/db");

async function listClients(req, res) {
  const { rows } = await query(
    `SELECT c.*,
            COUNT(i.id)::int AS invoice_count,
            COALESCE(SUM(i.total), 0) AS total_billed,
            COALESCE(SUM(CASE WHEN i.status <> 'paid' THEN i.total ELSE 0 END), 0) AS outstanding
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [req.user.id],
  );

  const clients = rows.map((r) => ({
    ...r,
    total_billed: Number(r.total_billed),
    outstanding: Number(r.outstanding),
  }));

  res.json({ clients });
}

async function getClient(req, res) {
  const client = await queryOne(
    "SELECT * FROM clients WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id],
  );
  if (!client) throw ApiError.notFound("Client not found");

  const { rows: invoices } = await query(
    `SELECT id, invoice_number, status, issue_date, due_date, total, currency, created_at
     FROM invoices WHERE client_id = $1 AND user_id = $2
     ORDER BY issue_date DESC, created_at DESC`,
    [req.params.id, req.user.id],
  );

  const totalBilled = invoices.reduce((s, i) => s + Number(i.total), 0);
  const outstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + Number(i.total), 0);

  res.json({
    client,
    invoices: invoices.map((i) => ({ ...i, total: Number(i.total) })),
    stats: { totalBilled, outstanding, count: invoices.length },
  });
}

async function createClient(req, res) {
  const b = req.body;
  const client = await queryOne(
    `INSERT INTO clients (user_id, name, email, company, phone, address, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      req.user.id,
      b.name,
      b.email || "",
      b.company || "",
      b.phone || "",
      b.address || "",
      b.notes || "",
    ],
  );

  res.status(201).json({ client });
}

async function updateClient(req, res) {
  const fields = ["name", "email", "company", "phone", "address", "notes"];
  const sets = [];
  const values = [req.params.id, req.user.id];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      values.push(req.body[f]);
      sets.push(`${f} = $${values.length}`);
    }
  }

  if (!sets.length) throw ApiError.badRequest("Nenhum campo para atualizar");

  const client = await queryOne(
    `UPDATE clients SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    values,
  );

  if (!client) throw ApiError.notFound("Cliente não encontrado");
  res.json({ client });
}

async function deleteClient(req, res) {
  const result = await query(
    "DELETE FROM clients WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id],
  );
  if (!result.rowCount) throw ApiError.notFound("Client not found");
  res.json({ ok: true });
}

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
};
