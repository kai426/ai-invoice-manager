const {
  createInvoice: createInvoiceRecord,
  deleteInvoice: deleteInvoiceRecord,
  listInvoices: listInvoiceRecords,
  loadInvoice,
  updateInvoice: updateInvoiceRecord,
  updateInvoiceStatus: updateInvoiceRecordStatus,
} = require("../services/invoiceService");

async function listInvoices(req, res) {
  const invoices = await listInvoiceRecords(req.user.id, req.query);
  res.json({ invoices });
}

async function getInvoice(req, res) {
  const invoice = await loadInvoice(req.user.id, req.params.id);
  res.json({ invoice });
}

async function createInvoice(req, res) {
  const invoice = await createInvoiceRecord(req.user.id, req.body);
  res.status(201).json({ invoice });
}

async function updateInvoice(req, res) {
  const invoice = await updateInvoiceRecord(
    req.user.id,
    req.params.id,
    req.body,
  );

  res.json({ invoice });
}

async function updateInvoiceStatus(req, res) {
  const invoice = await updateInvoiceRecordStatus(
    req.user.id,
    req.params.id,
    req.body.status,
  );

  res.json({ invoice });
}

async function deleteInvoice(req, res) {
  await deleteInvoiceRecord(req.user.id, req.params.id);
  res.json({ ok: true });
}

module.exports = {
  createInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
  updateInvoice,
  updateInvoiceStatus,
};
