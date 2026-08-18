const { validationResult } = require('express-validator');
const DataEntry = require('../models/dataEntry.model');

/**
 * @desc    Store email and password without hashing (SECURITY RISK)
 * @route   POST /api/data-entry
 * @access  Public
 * @warning This endpoint stores passwords in plaintext which is a severe security risk
 *          and violates security best practices. Use only for educational/specific testing purposes.
 */
exports.storeCredentials = async (req, res) => {
  try {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Create new data entry
    const dataEntry = new DataEntry({
      email,
      password, // SECURITY RISK: Password stored in plaintext
    });

    // Save to database
    await dataEntry.save();

    // Return success response
    res.status(201).json({
      message: 'Data stored successfully',
      data: {
        id: dataEntry._id,
        email: dataEntry.email
      }
    });
  } catch (error) {
    console.error('Data entry error:', error);
    res.status(500).json({ message: 'Server error storing data', error: error.message });
  }
};

/**
 * @desc    Get all stored credentials (SECURITY RISK)
 * @route   GET /api/data-entry
 * @access  Public
 * @warning This endpoint exposes plaintext passwords which is a severe security risk
 */
exports.getAllEntries = async (req, res) => {
  try {
    const entries = await DataEntry.find().select('email password createdAt');
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ message: 'Server error fetching data', error: error.message });
  }
};
