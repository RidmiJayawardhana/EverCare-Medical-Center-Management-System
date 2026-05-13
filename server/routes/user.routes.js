const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, getUserById, updateUser, deactivateUser, updateProfile } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('admin'), getAllUsers);
router.post('/', authorize('admin'), createUser);
router.put('/profile', updateProfile);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deactivateUser);

module.exports = router;
