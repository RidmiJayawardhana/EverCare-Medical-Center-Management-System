const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/evercare';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), DoctorProfile.deleteMany(), Appointment.deleteMany(), Payment.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // ── Super Admin ──────────────────────────────────────────────────────────
  const superAdmin = await User.create({
    username: 'ridmi_p', email: 'jayawardhanaridmi0125@gmail.com',
    password: '12345678rP@', firstName: 'Ridmi', lastName: 'Jayawardhana',
    role: 'admin', isVerified: true, isActive: true, phone: '0771234567'
  });
  console.log('👑 Super Admin created: ridmi_p / 12345678rP@');

  // ── Staff ────────────────────────────────────────────────────────────────
  const [receptionist, accountant] = await Promise.all([
    User.create({ username: 'reception1', email: 'reception@evercare.com', password: 'Password@123', firstName: 'Nimali', lastName: 'Perera', role: 'receptionist', isVerified: true, isActive: true, phone: '0779876543', createdBy: superAdmin._id }),
    User.create({ username: 'accountant1', email: 'accounts@evercare.com', password: 'Password@123', firstName: 'Kamal', lastName: 'Silva', role: 'accountant', isVerified: true, isActive: true, phone: '0762345678', createdBy: superAdmin._id }),
  ]);
  console.log('👥 Receptionist: reception1 / Password@123');
  console.log('💰 Accountant: accountant1 / Password@123');

  // ── Doctors ──────────────────────────────────────────────────────────────
  const doctorData = [
    { username: 'dr_fernando', email: 'dr.fernando@evercare.com', firstName: 'Amara', lastName: 'Fernando', phone: '0712345001', specialization: 'Cardiologist', fee: 3500, experience: 12, qualifications: ['MBBS - University of Colombo', 'MD Cardiology - PGIM'], bio: 'Specialist in heart diseases with over 12 years of experience.', reg: 'SLMC-12345' },
    { username: 'dr_wijesinghe', email: 'dr.wijesinghe@evercare.com', firstName: 'Nimal', lastName: 'Wijesinghe', phone: '0712345002', specialization: 'Pediatrician', fee: 2500, experience: 8, qualifications: ['MBBS - University of Kelaniya', 'MD Pediatrics - PGIM'], bio: 'Dedicated to children\'s health and wellbeing.', reg: 'SLMC-23456' },
    { username: 'dr_jayasuriya', email: 'dr.jayasuriya@evercare.com', firstName: 'Sachini', lastName: 'Jayasuriya', phone: '0712345003', specialization: 'Dermatologist', fee: 3000, experience: 6, qualifications: ['MBBS - University of Sri Jayewardenepura', 'MD Dermatology'], bio: 'Expert in skin conditions and cosmetic dermatology.', reg: 'SLMC-34567' },
    { username: 'dr_gunasekara', email: 'dr.gunasekara@evercare.com', firstName: 'Priyantha', lastName: 'Gunasekara', phone: '0712345004', specialization: 'General Physician', fee: 1500, experience: 15, qualifications: ['MBBS - University of Colombo'], bio: 'General practitioner with broad clinical experience.', reg: 'SLMC-45678' },
    { username: 'dr_ranasinghe', email: 'dr.ranasinghe@evercare.com', firstName: 'Dilini', lastName: 'Ranasinghe', phone: '0712345005', specialization: 'Neurologist', fee: 4000, experience: 10, qualifications: ['MBBS', 'MD Neurology - PGIM', 'Fellowship - London'], bio: 'Specialist in neurological disorders and brain health.', reg: 'SLMC-56789' },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const createdDoctors = [];

  for (const d of doctorData) {
    const user = await User.create({ username: d.username, email: d.email, password: 'Password@123', firstName: d.firstName, lastName: d.lastName, phone: d.phone, role: 'doctor', isVerified: true, isActive: true, createdBy: superAdmin._id });
    const profile = await DoctorProfile.create({
      user: user._id,
      specialization: d.specialization,
      consultationFee: d.fee,
      experience: d.experience,
      qualifications: d.qualifications,
      bio: d.bio,
      registrationNumber: d.reg,
      isAcceptingAppointments: true,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      totalReviews: Math.floor(Math.random() * 50 + 10),
      availability: days.map(day => ({ day, startTime: '09:00', endTime: '17:00', isActive: true }))
    });
    createdDoctors.push({ user, profile });
    console.log(`🩺 Doctor: ${d.username} / Password@123 (${d.specialization})`);
  }

  // ── Patients ─────────────────────────────────────────────────────────────
  const patientData = [
    { username: 'john_doe', email: 'john@example.com', firstName: 'John', lastName: 'Doe', phone: '0771112233' },
    { username: 'priya_k', email: 'priya@example.com', firstName: 'Priya', lastName: 'Kumari', phone: '0772223344' },
    { username: 'saman_p', email: 'saman@example.com', firstName: 'Saman', lastName: 'Pathirana', phone: '0773334455' },
  ];

  const createdPatients = [];
  for (const p of patientData) {
    const user = await User.create({ ...p, password: 'Password@123', role: 'patient', isVerified: true, isActive: true });
    createdPatients.push(user);
    console.log(`🧑 Patient: ${p.username} / Password@123`);
  }

  // ── Sample Appointments ──────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const apptDefs = [
    { patientIdx: 0, doctorIdx: 0, daysFromNow: 1, slot: '10:00', endSlot: '10:30', status: 'confirmed', fee: 3500 },
    { patientIdx: 1, doctorIdx: 1, daysFromNow: 0, slot: '09:00', endSlot: '09:30', status: 'confirmed', fee: 2500 },
    { patientIdx: 2, doctorIdx: 2, daysFromNow: 2, slot: '14:00', endSlot: '14:30', status: 'pending', fee: 3000 },
    { patientIdx: 0, doctorIdx: 3, daysFromNow: -3, slot: '11:00', endSlot: '11:30', status: 'completed', fee: 1500 },
    { patientIdx: 1, doctorIdx: 4, daysFromNow: -7, slot: '15:00', endSlot: '15:30', status: 'completed', fee: 4000 },
  ];

  for (const a of apptDefs) {
    const d = new Date(today); d.setDate(today.getDate() + a.daysFromNow);
    const appt = await Appointment.create({
      patient: createdPatients[a.patientIdx]._id,
      doctor: createdDoctors[a.doctorIdx].user._id,
      date: d,
      slotStart: a.slot,
      slotEnd: a.endSlot,
      status: a.status,
      consultationFee: a.fee,
      paymentStatus: a.status === 'completed' ? 'paid' : 'unpaid',
      checkedIn: a.status === 'confirmed' && a.daysFromNow === 0,
      reason: 'Routine consultation'
    });

    if (a.status === 'completed') {
      await Payment.create({ appointment: appt._id, patient: createdPatients[a.patientIdx]._id, doctor: createdDoctors[a.doctorIdx].user._id, amount: a.fee, status: 'completed', paymentMethod: 'mock' });
    }
  }

  console.log('📅 Sample appointments created');
  console.log('\n🎉 ====== SEED COMPLETE ======');
  console.log('🔐 Login credentials:');
  console.log('   Admin:        ridmi_p         / 12345678rP@');
  console.log('   Receptionist: reception1      / Password@123');
  console.log('   Accountant:   accountant1     / Password@123');
  console.log('   Doctor:       dr_fernando     / Password@123');
  console.log('   Patient:      john_doe        / Password@123');
  console.log('================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
