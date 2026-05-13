const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['payhere', 'cash', 'card', 'mock'], default: 'payhere' },
  // PayHere fields
  payhereOrderId: { type: String },
  payherePaymentId: { type: String },
  payhereStatusCode: { type: String },
  payhereStatusMessage: { type: String },
  // Invoice
  invoiceNumber: { type: String, unique: true, sparse: true },
  receiptUrl: { type: String },
  notes: { type: String },
  refundedAt: { type: Date },
  refundReason: { type: String },
}, { timestamps: true });

// Auto generate invoice number
paymentSchema.pre('save', async function(next) {
  if (!this.invoiceNumber && this.status === 'completed') {
    const count = await mongoose.model('Payment').countDocuments({ status: 'completed' });
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
