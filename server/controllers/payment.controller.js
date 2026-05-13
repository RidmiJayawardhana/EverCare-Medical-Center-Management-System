const crypto = require('crypto');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { sendPaymentReceipt } = require('../utils/email');

// ─── PayHere Helpers ────────────────────────────────────────────────────────
const PAYHERE_URL = process.env.PAYHERE_MODE === 'sandbox'
  ? 'https://sandbox.payhere.lk/pay/checkout'
  : 'https://www.payhere.lk/pay/checkout';

const generatePayhereHash = (merchantId, orderId, amount, currency, merchantSecret) => {
  const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const raw = `${merchantId}${orderId}${Number(amount).toFixed(2)}${currency}${hashedSecret}`;
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
};
// ────────────────────────────────────────────────────────────────────────────

// POST /api/payments/initiate - patient initiates payment
exports.initiatePayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.paymentStatus === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

    const payment = await Payment.create({
      appointment: appointment._id,
      patient: appointment.patient._id,
      doctor: appointment.doctor._id,
      amount: appointment.consultationFee,
      status: 'pending',
    });

    const orderId = payment._id.toString();
    const hash = generatePayhereHash(
      process.env.PAYHERE_MERCHANT_ID,
      orderId,
      appointment.consultationFee,
      'LKR',
      process.env.PAYHERE_MERCHANT_SECRET
    );

    const payhereData = {
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      return_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      notify_url: `${req.protocol}://${req.get('host')}/api/payments/notify`,
      order_id: orderId,
      items: `Consultation - Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      amount: Number(appointment.consultationFee).toFixed(2),
      currency: 'LKR',
      hash,
      first_name: appointment.patient.firstName,
      last_name: appointment.patient.lastName,
      email: appointment.patient.email,
      phone: appointment.patient.phone || '0000000000',
      address: 'EverCare Medical Center',
      city: 'Colombo',
      country: 'Sri Lanka',
      checkout_url: PAYHERE_URL,
    };

    res.json({ success: true, paymentId: payment._id, payhereData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/notify - PayHere server-to-server notification
exports.payhereNotify = async (req, res) => {
  try {
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = req.body;
    const localHash = generatePayhereHash(merchant_id, order_id, payhere_amount, payhere_currency, process.env.PAYHERE_MERCHANT_SECRET);

    if (localHash !== md5sig) {
      console.warn('PayHere hash mismatch - possible fraud attempt');
      return res.sendStatus(400);
    }

    const payment = await Payment.findById(order_id);
    if (!payment) return res.sendStatus(404);

    payment.payherePaymentId = payment_id;
    payment.payhereStatusCode = status_code;
    payment.payhereOrderId = order_id;

    if (status_code === '2') { // Success
      payment.status = 'completed';
      const appointment = await Appointment.findByIdAndUpdate(payment.appointment, { paymentStatus: 'paid', paymentId: payment._id, status: 'confirmed' }, { new: true }).populate('patient', 'firstName lastName email');
      await payment.save();
      await sendPaymentReceipt(appointment.patient.email, appointment.patient.firstName, { amount: payment.amount, invoiceNumber: payment.invoiceNumber });
      await Notification.create({ user: payment.patient, title: 'Payment Successful', message: `Payment of LKR ${payment.amount} received. Invoice: ${payment.invoiceNumber}`, type: 'payment' });
    } else if (status_code === '0') {
      payment.status = 'pending';
    } else {
      payment.status = 'failed';
    }
    await payment.save();
    res.sendStatus(200);
  } catch (err) {
    console.error('PayHere notify error:', err);
    res.sendStatus(500);
  }
};

// POST /api/payments/mock-complete - DEV ONLY: simulate successful payment
exports.mockComplete = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findByIdAndUpdate(paymentId,
      { status: 'completed', paymentMethod: 'mock' }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const appointment = await Appointment.findByIdAndUpdate(payment.appointment,
      { paymentStatus: 'paid', paymentId: payment._id, status: 'confirmed' }, { new: true })
      .populate('patient', 'firstName lastName email');

    await payment.save();
    await sendPaymentReceipt(appointment.patient.email, appointment.patient.firstName, { amount: payment.amount, invoiceNumber: payment.invoiceNumber || 'MOCK-001' });
    await Notification.create({ user: payment.patient, title: 'Payment Confirmed (Mock)', message: `Payment of LKR ${payment.amount} recorded. Appointment confirmed.`, type: 'payment' });

    res.json({ success: true, payment, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments - accountant/admin
exports.getPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, from, to } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName')
      .populate('appointment', 'date slotStart')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments/summary - accountant dashboard
exports.getPaymentSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [total, monthly, yearly, pending, byMonth] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Payment.countDocuments({ status: 'pending' }),
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfYear } } },
        { $group: { _id: { month: { $month: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      totalRevenue: total[0]?.total || 0,
      totalTransactions: total[0]?.count || 0,
      monthlyRevenue: monthly[0]?.total || 0,
      monthlyTransactions: monthly[0]?.count || 0,
      yearlyRevenue: yearly[0]?.total || 0,
      pendingPayments: pending,
      revenueByMonth: byMonth
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/:id/refund
exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id,
      { status: 'refunded', refundedAt: new Date(), refundReason: req.body.reason }, { new: true });
    await Appointment.findByIdAndUpdate(payment.appointment, { paymentStatus: 'refunded' });
    await Notification.create({ user: payment.patient, title: 'Payment Refunded', message: `Refund of LKR ${payment.amount} has been processed.`, type: 'payment' });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
