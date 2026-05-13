const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');

exports.submitFeedback = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only review completed appointments' });
    if (appointment.feedbackGiven) return res.status(400).json({ success: false, message: 'Feedback already given' });
    if (!appointment.patient.equals(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized' });

    const feedback = await Feedback.create({ appointment: appointmentId, patient: req.user._id, doctor: appointment.doctor, rating, comment });
    appointment.feedbackGiven = true;
    await appointment.save();
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDoctorFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ doctor: req.params.doctorId, isVisible: true })
      .populate('patient', 'firstName lastName profileImage')
      .sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleFeedbackVisibility = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Not found' });
    feedback.isVisible = !feedback.isVisible;
    await feedback.save();
    res.json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
