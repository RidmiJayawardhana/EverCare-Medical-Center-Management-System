const express = require('express');
const router = express.Router();
const { initiatePayment, payhereNotify, mockComplete, getPayments, getPaymentSummary, refundPayment } = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/notify', payhereNotify); // public - PayHere server calls this
router.use(protect);
router.post('/initiate', authorize('patient'), initiatePayment);
router.post('/mock-complete', authorize('patient', 'admin'), mockComplete);
router.get('/', authorize('accountant', 'admin'), getPayments);
router.get('/summary', authorize('accountant', 'admin'), getPaymentSummary);
router.post('/:id/refund', authorize('accountant', 'admin'), refundPayment);

module.exports = router;
