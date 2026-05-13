// MOCK EMAIL UTILITY
// All emails are logged to console. 
// To enable real email: set EMAIL_USER and EMAIL_PASS in .env and uncomment the nodemailer transporter.

const logEmail = (to, subject, body) => {
  console.log('\n📧 ============ EMAIL (MOCK) ============');
  console.log(`   TO:      ${to}`);
  console.log(`   SUBJECT: ${subject}`);
  console.log(`   BODY:    ${body}`);
  console.log('==========================================\n');
};

// Real email (uncomment + fill .env to use):
// const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransport({
//   service: process.env.EMAIL_SERVICE,
//   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
// });

exports.sendOTPEmail = async (email, name, otp) => {
  logEmail(email, 'EverCare - Email Verification OTP',
    `Hello ${name}, your OTP is: ${otp}. Valid for 10 minutes.`);
  return { success: true };
};

exports.sendWelcomeEmail = async (email, name, role) => {
  logEmail(email, 'Welcome to EverCare Medical Center',
    `Hello ${name}, your ${role} account has been created. Login at http://localhost:5173`);
  return { success: true };
};

exports.sendAppointmentConfirmation = async (email, name, appointmentDetails) => {
  logEmail(email, 'EverCare - Appointment Confirmed',
    `Hello ${name}, your appointment with ${appointmentDetails.doctorName} on ${appointmentDetails.date} at ${appointmentDetails.time} is confirmed. Fee: LKR ${appointmentDetails.fee}`);
  return { success: true };
};

exports.sendAppointmentCancellation = async (email, name, appointmentDetails) => {
  logEmail(email, 'EverCare - Appointment Cancelled',
    `Hello ${name}, your appointment with ${appointmentDetails.doctorName} on ${appointmentDetails.date} has been cancelled.`);
  return { success: true };
};

exports.sendAppointmentReminder = async (email, name, appointmentDetails) => {
  logEmail(email, 'EverCare - Appointment Reminder',
    `Hello ${name}, reminder: your appointment with ${appointmentDetails.doctorName} is tomorrow at ${appointmentDetails.time}.`);
  return { success: true };
};

exports.sendPasswordReset = async (email, name, otp) => {
  logEmail(email, 'EverCare - Password Reset OTP',
    `Hello ${name}, your password reset OTP is: ${otp}. Valid for 10 minutes.`);
  return { success: true };
};

exports.sendPaymentReceipt = async (email, name, paymentDetails) => {
  logEmail(email, 'EverCare - Payment Receipt',
    `Hello ${name}, payment of LKR ${paymentDetails.amount} received. Invoice: ${paymentDetails.invoiceNumber}`);
  return { success: true };
};
