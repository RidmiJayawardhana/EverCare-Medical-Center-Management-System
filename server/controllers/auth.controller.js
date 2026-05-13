const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordReset } = require('../utils/email');
const Notification = require('../models/Notification');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ success: true, token, user });
};

// POST /api/auth/register (patients only)
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;
    if (await User.findOne({ $or: [{ email }, { username }] }))
      return res.status(400).json({ success: false, message: 'Email or username already exists' });

    const user = await User.create({ username, email, password, firstName, lastName, phone, role: 'patient', isVerified: false });
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(email, user.fullName, otp);

    res.status(201).json({ success: true, message: 'Registration successful. Check console for OTP (mock mode).', userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.otp !== otp || user.otpExpiry < new Date())
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    await sendWelcomeEmail(user.email, user.fullName, user.role);
    await Notification.create({ user: user._id, title: 'Welcome to EverCare!', message: 'Your account is verified. Start booking appointments now.', type: 'system' });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
    if (!user.isVerified && user.role === 'patient')
      return res.status(401).json({ success: false, message: 'Please verify your email first', userId: user._id });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'No account with that email' });
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    await sendPasswordReset(user.email, user.fullName, otp);
    res.json({ success: true, message: 'OTP sent to email (check console in mock mode)', userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, password } = req.body;
    const user = await User.findById(userId).select('+otp +otpExpiry');
    if (!user || user.otp !== otp || user.otpExpiry < new Date())
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.password = password;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.mustChangePassword = false;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(req.body.currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = req.body.newPassword;
    user.mustChangePassword = false;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(user.email, user.fullName, otp);
    res.json({ success: true, message: 'OTP resent (check console)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
