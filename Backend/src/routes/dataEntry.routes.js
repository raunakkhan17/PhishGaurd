const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const dataEntryController = require('../controllers/dataEntry.controller');

// @route   POST /api/data-entry
// @desc    Store email and password without hashing (SECURITY RISK)
// @access  Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').notEmpty(),
  ],
  dataEntryController.storeCredentials
);

// @route   GET /api/data-entry
// @desc    Get all stored credentials (SECURITY RISK)
// @access  Public
router.get('/', dataEntryController.getAllEntries);

module.exports = router;
