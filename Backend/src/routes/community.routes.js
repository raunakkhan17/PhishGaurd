const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const communityController = require('../controllers/community.controller');
const { protect, extractUser } = require('../middleware/auth.middleware');

// @route   POST /api/community
// @desc    Create a new forum post
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('title', 'Title is required').notEmpty(),
      check('content', 'Content is required').notEmpty(),
      check('category', 'Category is required').notEmpty(),
    ],
  ],
  communityController.createForum
);

// @route   GET /api/community
// @desc    Get all forum posts with filters and pagination
// @access  Public (with optional user context)
router.get('/', extractUser, communityController.getForums);

// @route   GET /api/community/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', communityController.getCategories);

// @route   GET /api/community/:id
// @desc    Get forum by ID
// @access  Public (with optional user context)
router.get('/:id', extractUser, communityController.getForumById);

// @route   PUT /api/community/:id
// @desc    Update forum post
// @access  Private
router.put(
  '/:id',
  [
    protect,
    [
      check('title', 'Title is required').notEmpty(),
      check('content', 'Content is required').notEmpty(),
      check('category', 'Category is required').notEmpty(),
    ],
  ],
  communityController.updateForum
);

// @route   DELETE /api/community/:id
// @desc    Delete forum post
// @access  Private
router.delete('/:id', protect, communityController.deleteForum);

// @route   POST /api/community/:id/comments
// @desc    Add comment to forum
// @access  Private
router.post(
  '/:id/comments',
  [
    protect,
    [
      check('content', 'Comment content is required').optional(),
      check('text', 'Comment text is required').optional(),
      // Custom validation to ensure at least one of text or content is provided
      (req, res, next) => {
        if (!req.body.content && !req.body.text) {
          return res.status(400).json({ message: 'Either content or text field is required for comments' });
        }
        next();
      },
    ],
  ],
  communityController.addComment
);

// @route   DELETE /api/community/:id/comments/:commentId
// @desc    Delete comment
// @access  Private
router.delete('/:id/comments/:commentId', protect, communityController.deleteComment);

// @route   PUT /api/community/:id/like
// @desc    Like or unlike a forum post
// @access  Private
router.put('/:id/like', protect, communityController.toggleLike);

// @route   PUT /api/community/:id/comments/:commentId/like
// @desc    Like or unlike a comment
// @access  Private
router.put('/:id/comments/:commentId/like', protect, communityController.toggleCommentLike);

module.exports = router;
