const FlaggedWebsite = require('../models/directory.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get pending website submissions for admin review
 * @route   GET /api/admin/pending-websites
 * @access  Private/Admin
 */
exports.getPendingWebsites = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'latest' 
    } = req.query;

    // Build query for pending entries
    const query = { status: 'pending' };

    // Set up sorting
    let sortOption = {};
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highSeverity':
        sortOption = { severity: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const websites = await FlaggedWebsite.find(query)
      .populate('submittedBy', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination info
    const total = await FlaggedWebsite.countDocuments(query);

    res.json({
      websites,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
      },
    });
  } catch (error) {
    console.error('Get pending websites error:', error);
    res.status(500).json({ message: 'Server error fetching pending websites' });
  }
};

/**
 * @desc    Approve a flagged website submission
 * @route   PUT /api/admin/approve-website/:id
 * @access  Private/Admin
 */
exports.approveWebsite = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { reviewNotes } = req.body;
    
    // Find website entry
    const website = await FlaggedWebsite.findById(req.params.id);
    
    if (!website) {
      return res.status(404).json({ message: 'Flagged website not found' });
    }

    // Check if already reviewed
    if (website.status !== 'pending') {
      return res.status(400).json({ message: 'This entry has already been reviewed' });
    }

    // Update website status
    website.status = 'approved';
    website.reviewedBy = req.user.id;
    website.reviewNotes = reviewNotes || '';
    website.dateReviewed = Date.now();

    await website.save();

    // Return updated entry with populated fields
    const updatedWebsite = await FlaggedWebsite.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name');

    res.json(updatedWebsite);
  } catch (error) {
    console.error('Approve website error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Flagged website not found' });
    }
    
    res.status(500).json({ message: 'Server error approving website' });
  }
};

/**
 * @desc    Reject a flagged website submission
 * @route   PUT /api/admin/reject-website/:id
 * @access  Private/Admin
 */
exports.rejectWebsite = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { reviewNotes } = req.body;
    
    // Find website entry
    const website = await FlaggedWebsite.findById(req.params.id);
    
    if (!website) {
      return res.status(404).json({ message: 'Flagged website not found' });
    }

    // Check if already reviewed
    if (website.status !== 'pending') {
      return res.status(400).json({ message: 'This entry has already been reviewed' });
    }

    // Update website status
    website.status = 'rejected';
    website.reviewedBy = req.user.id;
    website.reviewNotes = reviewNotes || 'Rejected by admin';
    website.dateReviewed = Date.now();

    await website.save();

    // Return updated entry with populated fields
    const updatedWebsite = await FlaggedWebsite.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name');

    res.json(updatedWebsite);
  } catch (error) {
    console.error('Reject website error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Flagged website not found' });
    }
    
    res.status(500).json({ message: 'Server error rejecting website' });
  }
};

/**
 * @desc    Get dashboard statistics for admin
 * @route   GET /api/admin/dashboard-stats
 * @access  Private/Admin
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts of flagged websites by status
    const pendingCount = await FlaggedWebsite.countDocuments({ status: 'pending' });
    const approvedCount = await FlaggedWebsite.countDocuments({ status: 'approved' });
    const rejectedCount = await FlaggedWebsite.countDocuments({ status: 'rejected' });
    const totalCount = await FlaggedWebsite.countDocuments();
    
    // Get counts by category
    const categoryCounts = await FlaggedWebsite.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get counts by severity
    const severityCounts = await FlaggedWebsite.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { _id: 1 } } // Sort by severity (low to critical)
    ]);
    
    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSubmissions = await FlaggedWebsite.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { 
        _id: { 
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
        }, 
        count: { $sum: 1 } 
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalWebsites: totalCount,
      statusCounts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      categoryCounts,
      severityCounts,
      recentSubmissions,
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching admin dashboard stats' });
  }
};
