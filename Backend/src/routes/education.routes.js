const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const educationController = require('../controllers/education.controller');
const { protect } = require('../middleware/auth.middleware');

// @route   POST /api/education
// @desc    Create a new education resource
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('title', 'Title is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
      check('content', 'Content is required').notEmpty(),
      check('category', 'Category is required').notEmpty(),
      check('resourceType', 'Resource type is required').notEmpty(),
    ],
  ],
  educationController.createResource
);

// @route   GET /api/education
// @desc    Get all education resources with filters and pagination
// @access  Public
router.get('/', educationController.getResources);

// @route   GET /api/education/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', educationController.getCategories);

// @route   GET /api/education/resource-types
// @desc    Get all resource types
// @access  Public
router.get('/resource-types', educationController.getResourceTypes);

// @route   GET /api/education/:id
// @desc    Get resource by ID
// @access  Public
router.get('/:id', educationController.getResourceById);

// @route   PUT /api/education/:id
// @desc    Update education resource
// @access  Private
router.put(
  '/:id',
  [
    protect,
    [
      check('title', 'Title is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
      check('content', 'Content is required').notEmpty(),
      check('category', 'Category is required').notEmpty(),
      check('resourceType', 'Resource type is required').notEmpty(),
    ],
  ],
  educationController.updateResource
);

// @route   DELETE /api/education/:id
// @desc    Delete education resource
// @access  Private
router.delete('/:id', protect, educationController.deleteResource);

// @route   POST /api/education/:id/ratings
// @desc    Add rating to education resource
// @access  Private
router.post(
  '/:id/ratings',
  [
    protect,
    [
      check('value', 'Rating value is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
    ],
  ],
  educationController.addRating
);

// @route   DELETE /api/education/:id/ratings/:ratingId
// @desc    Delete rating
// @access  Private
router.delete('/:id/ratings/:ratingId', protect, educationController.deleteRating);

module.exports = router;
