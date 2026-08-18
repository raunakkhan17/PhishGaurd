const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Register a new user
router.post(
  '/register',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  authController.register
);

// Login user
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authController.login
);

// Register a new admin (admin only)
router.post(
  '/register-admin',
  [
    protect,
    admin,
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  authController.registerAdmin
);

// Get current user profile
router.get('/profile', protect, authController.getCurrentUser);

// Update user profile
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
