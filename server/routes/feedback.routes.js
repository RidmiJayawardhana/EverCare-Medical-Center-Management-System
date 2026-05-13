const express = require('express');
const router = express.Router();
const { submitFeedback, getDoctorFeedback, getAllFeedback, toggleFeedbackVisibility } = require('../controllers/feedback.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/doctor/:doctorId', getDoctorFeedback);
router.use(protect);
router.post('/', authorize('patient'), submitFeedback);
router.get('/', authorize('admin'), getAllFeedback);
router.put('/:id/toggle', authorize('admin'), toggleFeedbackVisibility);

module.exports = router;
