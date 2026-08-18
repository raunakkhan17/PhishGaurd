const EducationResource = require('../models/education.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new education resource
 * @route   POST /api/education
 * @access  Private
 */
exports.createResource = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, content, category, topics, resourceType, fileUrl } = req.body;
    
    // Handle topics field safely
    let processedTopics = [];
    if (topics) {
      processedTopics = Array.isArray(topics) ? topics : topics.split(',').map(topic => topic.trim());
    }

    // Verify required fields match enum values
    if (category && !['beginner', 'intermediate', 'advanced'].includes(category)) {
      return res.status(400).json({ message: 'Category must be beginner, intermediate, or advanced' });
    }

    if (resourceType && !['article', 'video', 'tutorial', 'ebook', 'webinar', 'tool', 'guide', 'other'].includes(resourceType)) {
      return res.status(400).json({ message: 'Invalid resource type' });
    }

    // Create new education resource
    const resource = await EducationResource.create({
      title,
      description,
      content,
      category,
      topics: processedTopics,
      resourceType,
      fileUrl: fileUrl || '',
      author: req.user.id,
    });

    // Populate author details
    const populatedResource = await EducationResource.findById(resource._id)
      .populate('author', 'name profilePicture');

    res.status(201).json(populatedResource);
  } catch (error) {
    console.error('Create education resource error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle mongoose errors related to enum values
    if (error.name === 'ValidatorError') {
      return res.status(400).json({ message: error.message });
    }

    // Check if error is with one of the fields
    if (error.path) {
      return res.status(400).json({ message: `Error with field '${error.path}': ${error.message}` });
    }
    
    // Generic server error with more details
    res.status(500).json({ 
      message: 'Server error creating education resource', 
      error: error.message
    });
  }
};

/**
 * @desc    Get all education resources with filters and pagination
 * @route   GET /api/education
 * @access  Public
 */
exports.getResources = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      resourceType,
      sort = 'latest',
      search,
      author,
    } = req.query;

    // Build query
    let query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Filter by resource type if provided
    if (resourceType) {
      query.resourceType = resourceType;
    }

    // Filter by author if provided
    if (author) {
      query.author = author;
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Set up sorting
    let sortOption = {};
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'topRated':
        sortOption = { averageRating: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const resources = await EducationResource.find(query)
      .populate('author', 'name profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination info
    const total = await EducationResource.countDocuments(query);

    res.json({
      resources,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
      },
    });
  } catch (error) {
    console.error('Get education resources error:', error);
    res.status(500).json({ message: 'Server error fetching education resources' });
  }
};

/**
 * @desc    Get resource by ID
 * @route   GET /api/education/:id
 * @access  Public
 */
exports.getResourceById = async (req, res) => {
  try {
    const resource = await EducationResource.findById(req.params.id)
      .populate('author', 'name profilePicture')
      .populate('ratings.user', 'name profilePicture');
    
    if (!resource) {
      return res.status(404).json({ message: 'Education resource not found' });
    }

    // Increment view count
    resource.views += 1;
    await resource.save();

    res.json(resource);
  } catch (error) {
    console.error('Get resource error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Education resource not found' });
    }
    
    res.status(500).json({ message: 'Server error fetching education resource' });
  }
};

/**
 * @desc    Update education resource
 * @route   PUT /api/education/:id
 * @access  Private
 */
exports.updateResource = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, content, category, topics, resourceType, fileUrl, isPublished } = req.body;
    
    // Find resource
    let resource = await EducationResource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Education resource not found' });
    }

    // Check if user is author or admin
    if (resource.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this resource' });
    }

    // Update fields
    resource.title = title || resource.title;
    resource.description = description || resource.description;
    resource.content = content || resource.content;
    resource.category = category || resource.category;
    resource.topics = topics 
      ? (Array.isArray(topics) ? topics : topics.split(',').map(topic => topic.trim())) 
      : resource.topics;
    resource.resourceType = resourceType || resource.resourceType;
    resource.fileUrl = fileUrl !== undefined ? fileUrl : resource.fileUrl;
    resource.isPublished = isPublished !== undefined ? isPublished : resource.isPublished;

    // Save updated resource
    await resource.save();
    
    // Return updated resource with populated fields
    resource = await EducationResource.findById(req.params.id)
      .populate('author', 'name profilePicture')
      .populate('ratings.user', 'name profilePicture');

    res.json(resource);
  } catch (error) {
    console.error('Update resource error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Education resource not found' });
    }
    
    res.status(500).json({ message: 'Server error updating education resource' });
  }
};

/**
 * @desc    Delete education resource
 * @route   DELETE /api/education/:id
 * @access  Private
 */
exports.deleteResource = async (req, res) => {
  try {
    const resource = await EducationResource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Education resource not found' });
    }

    // Check if user is author or admin
    if (resource.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this resource' });
    }

    await resource.deleteOne();

    res.json({ message: 'Education resource removed' });
  } catch (error) {
    console.error('Delete resource error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Education resource not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting education resource' });
  }
};

/**
 * @desc    Add rating to education resource
 * @route   POST /api/education/:id/ratings
 * @access  Private
 */
exports.addRating = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { value, comment } = req.body;
    
    // Find education resource
    const resource = await EducationResource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Education resource not found' });
    }

    // Check if user has already rated
    const alreadyRated = resource.ratings.find(
      (rating) => rating.user.toString() === req.user.id
    );

    if (alreadyRated) {
      // Update existing rating
      alreadyRated.value = value;
      alreadyRated.comment = comment || alreadyRated.comment;
      alreadyRated.date = Date.now();
    } else {
      // Add new rating
      resource.ratings.push({
        user: req.user.id,
        value,
        comment,
      });
    }

    // Calculate average rating
    const totalRating = resource.ratings.reduce((sum, rating) => sum + rating.value, 0);
    resource.averageRating = totalRating / resource.ratings.length;

    await resource.save();
    
    // Return updated resource with populated ratings
    const updatedResource = await EducationResource.findById(req.params.id)
      .populate('ratings.user', 'name profilePicture');

    res.json(updatedResource.ratings);
  } catch (error) {
    console.error('Add rating error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Education resource not found' });
    }
    
    res.status(500).json({ message: 'Server error adding rating' });
  }
};

/**
 * @desc    Delete rating from education resource
 * @route   DELETE /api/education/:id/ratings/:ratingId
 * @access  Private
 */
exports.deleteRating = async (req, res) => {
  try {
    // Find education resource
    const resource = await EducationResource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Education resource not found' });
    }

    // Find rating
    const rating = resource.ratings.find(
      (rating) => rating._id.toString() === req.params.ratingId
    );

    // Check if rating exists
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Check if user is rating author or admin
    if (rating.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this rating' });
    }

    // Get remove index
    const removeIndex = resource.ratings
      .map((rating) => rating._id.toString())
      .indexOf(req.params.ratingId);

    // Remove rating
    resource.ratings.splice(removeIndex, 1);
    
    // Recalculate average rating if ratings remain
    if (resource.ratings.length > 0) {
      const totalRating = resource.ratings.reduce((sum, rating) => sum + rating.value, 0);
      resource.averageRating = totalRating / resource.ratings.length;
    } else {
      resource.averageRating = 0;
    }

    await resource.save();

    res.json(resource.ratings);
  } catch (error) {
    console.error('Delete rating error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Education resource or rating not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting rating' });
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/education/categories
 * @access  Public
 */
exports.getCategories = async (req, res) => {
  try {
    // Return predefined categories
    const categories = ['beginner', 'intermediate', 'advanced'];
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

/**
 * @desc    Get all resource types
 * @route   GET /api/education/resource-types
 * @access  Public
 */
exports.getResourceTypes = async (req, res) => {
  try {
    // Get unique resource types
    const resourceTypes = await EducationResource.distinct('resourceType');
    res.json(resourceTypes);
  } catch (error) {
    console.error('Get resource types error:', error);
    res.status(500).json({ message: 'Server error fetching resource types' });
  }
};
