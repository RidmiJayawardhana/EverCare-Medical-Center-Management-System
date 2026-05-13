const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
  isVisible: { type: Boolean, default: true },
}, { timestamps: true });

// Update doctor rating after feedback
feedbackSchema.post('save', async function () {
  const DoctorProfile = require('./DoctorProfile');
  const feedbacks = await mongoose.model('Feedback').find({ doctor: this.doctor, isVisible: true });
  const avg = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
  await DoctorProfile.findOneAndUpdate({ user: this.doctor }, { rating: Math.round(avg * 10) / 10, totalReviews: feedbacks.length });
});

module.exports = mongoose.model('Feedback', feedbackSchema);
