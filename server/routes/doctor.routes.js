const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, getAvailableSlots, updateDoctorProfile, getSpecializations } = require('../controllers/doctor.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDoctors);
router.get('/specializations', getSpecializations);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getAvailableSlots);
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);

module.exports = router;
