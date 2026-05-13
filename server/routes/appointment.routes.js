const express = require('express');
const router = express.Router();
const { bookAppointment, getAppointments, getAppointmentById, updateStatus, cancelAppointment, checkIn, rescheduleAppointment } = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('patient', 'receptionist'), bookAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id/status', authorize('doctor', 'admin'), updateStatus);
router.put('/:id/cancel', cancelAppointment);
router.put('/:id/checkin', authorize('receptionist', 'admin'), checkIn);
router.put('/:id/reschedule', authorize('patient', 'receptionist'), rescheduleAppointment);

module.exports = router;
