const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { sendWelcomeEmail } = require('../utils/email');
const Notification = require('../models/Notification');

// GET /api/users - Admin: get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
    ];
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate('createdBy', 'firstName lastName');
    res.json({ success: true, total, page: Number(page), users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users - Admin: create staff user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, role, specialization, consultationFee, qualifications, experience, bio, registrationNumber } = req.body;
    if (['patient'].includes(role)) return res.status(400).json({ success: false, message: 'Patients self-register.' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can create staff.' });
    if (req.user.role === 'admin' && role === 'admin' && !req.user._id.equals(await getFirstAdminId()))
      return res.status(403).json({ success: false, message: 'Only Super Admin can create other admins.' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ success: false, message: 'Email or username already taken.' });

    const user = await User.create({ username, email, password, firstName, lastName, phone, role, isVerified: true, mustChangePassword: true, createdBy: req.user._id });

    if (role === 'doctor') {
      await DoctorProfile.create({ user: user._id, specialization: specialization || 'General', consultationFee: consultationFee || 0, qualifications: qualifications || [], experience: experience || 0, bio: bio || '', registrationNumber: registrationNumber || '' });
    }

    await sendWelcomeEmail(email, user.fullName, role);
    await Notification.create({ user: user._id, title: 'Account Created', message: `Your ${role} account has been created by admin. Please login and change your password.`, type: 'system' });

    res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFirstAdminId = async () => {
  const first = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  return first?._id;
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('createdBy', 'firstName lastName');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone', 'isActive', 'profileImage'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/:id (deactivate)
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/users/profile - update own profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { firstName, lastName, phone, profileImage }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
