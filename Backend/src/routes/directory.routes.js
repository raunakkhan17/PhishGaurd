const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const directoryController = require('../controllers/directory.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// @route   POST /api/directory
// @desc    Submit a new flagged website
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('url', 'Valid URL is required').isURL(),
      check('title', 'Title is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
      check('category', 'Category is required').notEmpty(),
      check('severity', 'Severity is required').notEmpty(),
      check('evidence', 'Evidence is required').notEmpty(),
    ],
  ],
  directoryController.submitWebsite
);

// @route   GET /api/directory
// @desc    Get all flagged websites with filters and pagination
// @access  Public (but some filters limited to admin)
router.get('/', directoryController.getFlaggedWebsites);

// @route   GET /api/directory/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', directoryController.getCategories);

// @route   GET /api/directory/severity-levels
// @desc    Get severity levels
// @access  Public
router.get('/severity-levels', directoryController.getSeverityLevels);

// @route   GET /api/directory/:id
// @desc    Get flagged website by ID
// @access  Public/Private (depends on status)
router.get('/:id', directoryController.getFlaggedWebsiteById);

// @route   PUT /api/directory/:id
// @desc    Update flagged website
// @access  Private
router.put(
  '/:id',
  [
    protect,
    [
      check('url', 'Valid URL is required').isURL(),
      check('title', 'Title is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
      check('category', 'Category is required').notEmpty(),
      check('severity', 'Severity is required').notEmpty(),
      check('evidence', 'Evidence is required').notEmpty(),
    ],
  ],
  directoryController.updateFlaggedWebsite
);

// @route   DELETE /api/directory/:id
// @desc    Delete flagged website
// @access  Private
router.delete('/:id', protect, directoryController.deleteFlaggedWebsite);

// @route   POST /api/directory/:id/report
// @desc    Add report to a flagged website
// @access  Private
router.post(
  '/:id/report',
  [
    protect,
    [
      check('comment', 'Comment is required').notEmpty(),
    ],
  ],
  directoryController.addReport
);

// @route   POST /api/directory/check-url
// @desc    Check if URL is potentially phishing
// @access  Public
router.post(
  '/check-url',
  [
    check('url', 'Valid URL is required').notEmpty(),
  ],
  directoryController.checkUrl
);

module.exports = router;
