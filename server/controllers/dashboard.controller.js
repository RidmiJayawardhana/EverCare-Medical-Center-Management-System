const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Feedback = require('../models/Feedback');
const DoctorProfile = require('../models/DoctorProfile');

exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalPatients, totalAppointments, pendingAppointments, completedAppointments, totalRevenue, recentAppointments, recentUsers] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'patient', isActive: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' }),
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Appointment.find().sort({ createdAt: -1 }).limit(5).populate('patient doctor', 'firstName lastName'),
      User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role createdAt'),
    ]);
    res.json({ success: true, stats: { totalUsers, totalDoctors, totalPatients, totalAppointments, pendingAppointments, completedAppointments, totalRevenue: totalRevenue[0]?.total || 0 }, recentAppointments, recentUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDoctorDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const [todayAppts, totalPatients, pendingAppts, completedAppts, profile, recentFeedback] = await Promise.all([
      Appointment.find({ doctor: req.user._id, date: { $gte: today, $lt: tomorrow }, status: { $in: ['pending', 'confirmed'] } }).populate('patient', 'firstName lastName phone'),
      Appointment.distinct('patient', { doctor: req.user._id }),
      Appointment.countDocuments({ doctor: req.user._id, status: 'pending' }),
      Appointment.countDocuments({ doctor: req.user._id, status: 'completed' }),
      DoctorProfile.findOne({ user: req.user._id }),
      Feedback.find({ doctor: req.user._id, isVisible: true }).sort({ createdAt: -1 }).limit(3).populate('patient', 'firstName lastName'),
    ]);

    res.json({ success: true, stats: { todayAppointments: todayAppts.length, totalPatients: totalPatients.length, pendingAppointments: pendingAppts, completedAppointments: completedAppts, rating: profile?.rating || 0 }, todayAppointments: todayAppts, profile, recentFeedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPatientDashboard = async (req, res) => {
  try {
    const upcoming = await Appointment.find({ patient: req.user._id, status: { $in: ['pending', 'confirmed'] }, date: { $gte: new Date() } }).populate('doctor', 'firstName lastName').sort({ date: 1 }).limit(5);
    const past = await Appointment.find({ patient: req.user._id, status: { $in: ['completed', 'cancelled'] } }).populate('doctor', 'firstName lastName').sort({ date: -1 }).limit(5);
    const totalSpent = await Payment.aggregate([{ $match: { patient: req.user._id, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({ success: true, stats: { upcomingCount: upcoming.length, totalAppointments: upcoming.length + past.length, totalSpent: totalSpent[0]?.total || 0 }, upcomingAppointments: upcoming, pastAppointments: past });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReceptionistDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const [todayAll, checkedIn, pending, total] = await Promise.all([
      Appointment.find({ date: { $gte: today, $lt: tomorrow } }).populate('patient doctor', 'firstName lastName phone').sort({ slotStart: 1 }),
      Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow }, checkedIn: true }),
      Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'pending' }),
      Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    ]);
    res.json({ success: true, stats: { todayTotal: total, checkedIn, pending, remaining: total - checkedIn }, todayAppointments: todayAll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAccountantDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [monthly, pending, recent, byDoctor] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Payment.countDocuments({ status: 'pending' }),
      Payment.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(10).populate('patient', 'firstName lastName').populate('appointment', 'date slotStart'),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$doctor', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }, { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'doctor' } },
        { $unwind: '$doctor' }
      ])
    ]);
    res.json({ success: true, stats: { monthlyRevenue: monthly[0]?.total || 0, monthlyTransactions: monthly[0]?.count || 0, pendingPayments: pending }, recentPayments: recent, revenueByDoctor: byDoctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
