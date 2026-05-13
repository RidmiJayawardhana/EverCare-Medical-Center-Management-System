const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
  isActive: { type: Boolean, default: true },
});

const doctorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true, trim: true },
  qualifications: [{ type: String, trim: true }],
  experience: { type: Number, default: 0 }, // years
  bio: { type: String, trim: true },
  consultationFee: { type: Number, required: true, default: 0 },
  availability: [timeSlotSchema],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isAcceptingAppointments: { type: Boolean, default: true },
  registrationNumber: { type: String, trim: true },
}, { timestamps: true });

// Generate 30-minute slots for a given day
doctorProfileSchema.methods.generateSlots = function(day, date) {
  const dayAvail = this.availability.find(a => a.day === day && a.isActive);
  if (!dayAvail) return [];
  const slots = [];
  const [sh, sm] = dayAvail.startTime.split(':').map(Number);
  const [eh, em] = dayAvail.endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current + 30 <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    const nh = Math.floor((current + 30) / 60).toString().padStart(2, '0');
    const nm = ((current + 30) % 60).toString().padStart(2, '0');
    slots.push({ start: `${h}:${m}`, end: `${nh}:${nm}` });
    current += 30;
  }
  return slots;
};

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
