const express = require('express');
const router = express.Router();
const { getAdminDashboard, getDoctorDashboard, getPatientDashboard, getReceptionistDashboard, getAccountantDashboard } = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/doctor', authorize('doctor'), getDoctorDashboard);
router.get('/patient', authorize('patient'), getPatientDashboard);
router.get('/receptionist', authorize('receptionist'), getReceptionistDashboard);
router.get('/accountant', authorize('accountant'), getAccountantDashboard);

module.exports = router;
