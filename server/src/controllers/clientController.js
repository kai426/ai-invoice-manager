const {
  createClient: createClientRecord,
  deleteClient: deleteClientRecord,
  getClient: getClientRecord,
  listClients: listClientRecords,
  updateClient: updateClientRecord,
} = require("../services/clientService");

async function listClients(req, res) {
  const clients = await listClientRecords(req.user.id);
  res.json({ clients });
}

async function getClient(req, res) {
  res.json(await getClientRecord(req.user.id, req.params.id));
}

async function createClient(req, res) {
  const client = await createClientRecord(req.user.id, req.body);
  res.status(201).json({ client });
}

async function updateClient(req, res) {
  const client = await updateClientRecord(req.user.id, req.params.id, req.body);
  res.json({ client });
}

async function deleteClient(req, res) {
  await deleteClientRecord(req.user.id, req.params.id);
  res.json({ ok: true });
}

module.exports = { createClient, deleteClient, getClient, listClients, updateClient };
