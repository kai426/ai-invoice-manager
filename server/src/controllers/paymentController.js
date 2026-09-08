const {
  createPayment: createPaymentRecord,
  deletePayment: deletePaymentRecord,
  listPayments: listPaymentRecords,
} = require("../services/paymentService");

async function listPayments(req, res) {
  res.json(await listPaymentRecords(req.user.id));
}

async function createPayment(req, res) {
  const payment = await createPaymentRecord(req.user.id, req.body);
  res.status(201).json({ payment });
}

async function deletePayment(req, res) {
  await deletePaymentRecord(req.user.id, req.params.id);
  res.json({ ok: true });
}

module.exports = { createPayment, deletePayment, listPayments };
