const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// GET /api/doctors - public
exports.getDoctors = async (req, res) => {
  try {
    const { specialization, search, page = 1, limit = 12 } = req.query;
    const profileQuery = {};
    if (specialization) profileQuery.specialization = { $regex: specialization, $options: 'i' };

    let userQuery = { role: 'doctor', isActive: true };
    if (search) userQuery.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(userQuery).select('_id');
    const userIds = users.map(u => u._id);
    if (search) profileQuery.user = { $in: userIds };

    const total = await DoctorProfile.countDocuments(profileQuery);
    const profiles = await DoctorProfile.find(profileQuery)
      .populate('user', 'firstName lastName email profileImage isActive')
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, profiles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/doctors/:id - public
exports.getDoctorById = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.params.id })
      .populate('user', 'firstName lastName email profileImage phone');
    if (!profile) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date required' });

    const profile = await DoctorProfile.findOne({ user: req.params.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const allSlots = profile.generateSlots(dayName, date);

    // Remove already booked slots
    const booked = await Appointment.find({
      doctor: req.params.id,
      date: { $gte: new Date(date), $lt: new Date(new Date(date).getTime() + 86400000) },
      status: { $in: ['pending', 'confirmed'] }
    }).select('slotStart');

    const bookedTimes = booked.map(a => a.slotStart);
    const available = allSlots.filter(s => !bookedTimes.includes(s.start));

    res.json({ success: true, date, day: dayName, allSlots, available, booked: bookedTimes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/doctors/profile - doctor updates own profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const { specialization, qualifications, experience, bio, consultationFee, availability, isAcceptingAppointments, registrationNumber } = req.body;
    const profile = await DoctorProfile.findOneAndUpdate(
      { user: req.user._id },
      { specialization, qualifications, experience, bio, consultationFee, availability, isAcceptingAppointments, registrationNumber },
      { new: true, runValidators: true, upsert: true }
    ).populate('user', 'firstName lastName email profileImage');
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/doctors/specializations - public
exports.getSpecializations = async (req, res) => {
  try {
    const specs = await DoctorProfile.distinct('specialization');
    res.json({ success: true, specializations: specs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
