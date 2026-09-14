const {
  createBusinessSummary,
  createInvoiceNote,
  createPaymentReminder,
  parseReceipt,
} = require("../services/aiService");

async function parseReceiptUpload(req, res) {
  const result = await parseReceipt(req.file);
  res.json({ result });
}

async function getBusinessSummary(req, res) {
  res.json(await createBusinessSummary(req.user.id));
}

async function createReminder(req, res) {
  const reminder = await createPaymentReminder(
    req.user.id,
    req.user.name,
    req.body,
  );
  res.json(reminder);
}

async function writeInvoiceNote(req, res) {
  const text = await createInvoiceNote(req.body);
  res.json({ text });
}

module.exports = {
  createReminder,
  getBusinessSummary,
  parseReceiptUpload,
  writeInvoiceNote,
};
