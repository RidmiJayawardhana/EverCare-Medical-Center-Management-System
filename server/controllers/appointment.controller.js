const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require('../utils/email');

// POST /api/appointments - patient books appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, slotStart, slotEnd, reason } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') return res.status(404).json({ success: false, message: 'Doctor not found' });

    const profile = await DoctorProfile.findOne({ user: doctorId });
    if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    if (!profile.isAcceptingAppointments) return res.status(400).json({ success: false, message: 'Doctor not accepting appointments' });

    // Check slot availability
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: new Date(date), $lt: new Date(new Date(date).getTime() + 86400000) },
      slotStart,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (conflict) return res.status(400).json({ success: false, message: 'Slot already booked' });

    const patientId = req.user.role === 'receptionist' ? req.body.patientId : req.user._id;

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date: new Date(date),
      slotStart,
      slotEnd,
      reason,
      consultationFee: profile.consultationFee,
    });

    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'doctor', select: 'firstName lastName email' }
    ]);

    // Notifications
    await Notification.create([
      { user: patientId, title: 'Appointment Booked', message: `Appointment with Dr. ${doctor.firstName} ${doctor.lastName} on ${new Date(date).toDateString()} at ${slotStart} is pending confirmation.`, type: 'appointment' },
      { user: doctorId, title: 'New Appointment Request', message: `${appointment.patient.firstName} ${appointment.patient.lastName} has booked a slot on ${new Date(date).toDateString()} at ${slotStart}.`, type: 'appointment' }
    ]);

    await sendAppointmentConfirmation(appointment.patient.email, appointment.patient.firstName, {
      doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      date: new Date(date).toDateString(),
      time: slotStart,
      fee: profile.consultationFee
    });

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/appointments - role-based
exports.getAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, date } = req.query;
    let query = {};

    if (req.user.role === 'patient') query.patient = req.user._id;
    else if (req.user.role === 'doctor') query.doctor = req.user._id;
    // admin, receptionist, accountant see all

    if (status) query.status = status;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email')
      .sort({ date: -1, slotStart: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/appointments/:id
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email')
      .populate('paymentId');
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/appointments/:id/status - doctor/admin update
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id).populate('patient doctor', 'firstName lastName email');
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });

    appointment.status = status;
    if (notes) appointment.notes = notes;
    await appointment.save();

    await Notification.create({ user: appointment.patient._id, title: `Appointment ${status}`, message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} has been ${status}.`, type: 'appointment' });

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id).populate('patient doctor', 'firstName lastName email');
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    if (['completed', 'cancelled'].includes(appointment.status))
      return res.status(400).json({ success: false, message: 'Cannot cancel this appointment' });

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = reason;
    await appointment.save();

    await sendAppointmentCancellation(appointment.patient.email, appointment.patient.firstName, {
      doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      date: appointment.date.toDateString()
    });

    await Notification.create([
      { user: appointment.patient._id, title: 'Appointment Cancelled', message: `Your appointment on ${appointment.date.toDateString()} has been cancelled. Reason: ${reason}`, type: 'appointment' },
      { user: appointment.doctor._id, title: 'Appointment Cancelled', message: `Appointment with ${appointment.patient.firstName} ${appointment.patient.lastName} on ${appointment.date.toDateString()} was cancelled.`, type: 'appointment' }
    ]);

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/appointments/:id/checkin - receptionist
exports.checkIn = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id,
      { checkedIn: true, checkedInAt: new Date(), checkedInBy: req.user._id, status: 'confirmed' },
      { new: true }).populate('patient doctor', 'firstName lastName email');
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    await Notification.create({ user: appointment.doctor._id, title: 'Patient Checked In', message: `${appointment.patient.firstName} ${appointment.patient.lastName} has checked in for ${appointment.slotStart} appointment.`, type: 'appointment' });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { date, slotStart, slotEnd } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });

    const conflict = await Appointment.findOne({
      doctor: appointment.doctor, date: new Date(date), slotStart,
      status: { $in: ['pending', 'confirmed'] }, _id: { $ne: appointment._id }
    });
    if (conflict) return res.status(400).json({ success: false, message: 'Slot not available' });

    appointment.date = new Date(date);
    appointment.slotStart = slotStart;
    appointment.slotEnd = slotEnd;
    appointment.status = 'pending';
    await appointment.save();

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
