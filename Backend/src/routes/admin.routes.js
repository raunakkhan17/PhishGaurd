const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Apply admin protection to all routes in this router
router.use(protect);
router.use(admin);

// @route   GET /api/admin/pending-websites
// @desc    Get pending website submissions for admin review
// @access  Private/Admin
router.get('/pending-websites', adminController.getPendingWebsites);

// @route   PUT /api/admin/approve-website/:id
// @desc    Approve a flagged website submission
// @access  Private/Admin
router.put(
  '/approve-website/:id',
  [
    check('reviewNotes', 'Review notes are required').optional(),
  ],
  adminController.approveWebsite
);

// @route   PUT /api/admin/reject-website/:id
// @desc    Reject a flagged website submission
// @access  Private/Admin
router.put(
  '/reject-website/:id',
  [
    check('reviewNotes', 'Review notes are required for rejections').notEmpty(),
  ],
  adminController.rejectWebsite
);

// @route   GET /api/admin/dashboard-stats
// @desc    Get dashboard statistics for admin
// @access  Private/Admin
router.get('/dashboard-stats', adminController.getDashboardStats);

module.exports = router;
