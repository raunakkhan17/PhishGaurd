const Forum = require('../models/forum.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new forum post
 * @route   POST /api/community
 * @access  Private
 */
exports.createForum = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, category, tags } = req.body;

    // Create new forum post
    const forum = await Forum.create({
      title,
      content,
      author: req.user.id,
      category,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
    });

    // Populate author details
    const populatedForum = await Forum.findById(forum._id)
      .populate('author', 'name profilePicture');

    res.status(201).json(populatedForum);
  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json({ message: 'Server error creating forum post' });
  }
};

/**
 * @desc    Get all forum posts with filters and pagination
 * @route   GET /api/community
 * @access  Public
 */
exports.getForums = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
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
      case 'mostLiked':
        sortOption = { 'likes.length': -1 };
        break;
      case 'mostCommented':
        sortOption = { 'comments.length': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with complete details
    const forums = await Forum.find(query)
      .populate('author', 'name email profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination info
    const total = await Forum.countDocuments(query);
    
    // Get user ID from token if present
    const userId = req.user ? req.user.id : null;
    
    // Format response with metadata counts
    const formattedForums = forums.map(forum => {
      return {
        _id: forum._id,
        title: forum.title,
        content: forum.content,
        category: forum.category,
        tags: forum.tags,
        author: {
          _id: forum.author._id,
          name: forum.author.name,
          profilePicture: forum.author.profilePicture || ''
        },
        createdAt: forum.createdAt,
        updatedAt: forum.updatedAt,
        meta: {
          views: forum.views,
          likes: forum.likes.length,
          comments: forum.comments.length
        },
        // Check if current user has liked this post
        userHasLiked: userId ? forum.likes.some(like => like.toString() === userId) : false,
        // Don't include full comments list in the overview
        // These will be shown in detail view
        isPinned: forum.isPinned || false,
        isActive: forum.isActive !== false // Default to true if not set
      };
    });

    res.json({
      forums: formattedForums,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
      },
    });
  } catch (error) {
    console.error('Get forums error:', error);
    res.status(500).json({ message: 'Server error fetching forums' });
  }
};

/**
 * @desc    Get forum by ID
 * @route   GET /api/community/:id
 * @access  Public
 */
exports.getForumById = async (req, res) => {
  try {
    // Get user ID from token if present (for checking if user has liked the post)
    const userId = req.user ? req.user.id : null;

    const forum = await Forum.findById(req.params.id)
      .populate('author', 'name email profilePicture bio')
      .populate('comments.user', 'name profilePicture');
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    // Increment view count
    forum.views += 1;
    await forum.save();

    // Format response for detailed view
    const detailedForum = {
      _id: forum._id,
      title: forum.title,
      content: forum.content,
      category: forum.category,
      tags: forum.tags,
      author: {
        _id: forum.author._id,
        name: forum.author.name,
        profilePicture: forum.author.profilePicture || '',
        bio: forum.author.bio || ''
      },
      createdAt: forum.createdAt,
      updatedAt: forum.updatedAt,
      stats: {
        views: forum.views,
        likes: forum.likes.length,
        comments: forum.comments.length
      },
      // Format comments for better readability
      comments: forum.comments.map(comment => ({
        _id: comment._id,
        text: comment.text,
        user: {
          _id: comment.user._id,
          name: comment.user.name,
          profilePicture: comment.user.profilePicture || ''
        },
        likes: comment.likes,
        createdAt: comment.date,
        // Check if current user has liked this comment
        userHasLiked: userId ? comment.likes.some(like => like.toString() === userId) : false
      })),
      // Check if current user has liked this post
      userHasLiked: userId ? forum.likes.some(like => like.toString() === userId) : false,
      isPinned: forum.isPinned || false,
      isActive: forum.isActive !== false
    };

    res.json(detailedForum);
  } catch (error) {
    console.error('Get forum error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Forum post not found' });
    }
    
    res.status(500).json({ message: 'Server error fetching forum post' });
  }
};

/**
 * @desc    Update forum post
 * @route   PUT /api/community/:id
 * @access  Private
 */
exports.updateForum = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, category, tags } = req.body;
    
    // Find forum post
    let forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    // Check if user is author or admin
    if (forum.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Update fields
    forum.title = title || forum.title;
    forum.content = content || forum.content;
    forum.category = category || forum.category;
    forum.tags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : forum.tags;

    // Save updated forum
    await forum.save();
    
    // Return updated forum with populated fields
    forum = await Forum.findById(req.params.id)
      .populate('author', 'name profilePicture')
      .populate('comments.user', 'name profilePicture');

    res.json(forum);
  } catch (error) {
    console.error('Update forum error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Forum post not found' });
    }
    
    res.status(500).json({ message: 'Server error updating forum post' });
  }
};

/**
 * @desc    Delete forum post
 * @route   DELETE /api/community/:id
 * @access  Private
 */
exports.deleteForum = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    // Check if user is author or admin
    if (forum.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await forum.deleteOne();

    res.json({ message: 'Forum post removed' });
  } catch (error) {
    console.error('Delete forum error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Forum post not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting forum post' });
  }
};

/**
 * @desc    Add comment to forum
 * @route   POST /api/community/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Allow either 'text' or 'content' field for compatibility
    const content = req.body.content || req.body.text;
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Find forum post
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    const user = await User.findById(req.user.id).select('name');

    // Create new comment
    const newComment = {
      text: content, // Store in the 'text' field as per schema
      user: req.user.id,
      name: user.name,
    };

    // Add comment to forum
    forum.comments.unshift(newComment);
    await forum.save();
    
    // Return updated forum with populated comments
    const updatedForum = await Forum.findById(req.params.id)
      .populate('comments.user', 'name profilePicture');

    res.json(updatedForum.comments);
  } catch (error) {
    console.error('Add comment error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Forum post not found' });
    }
    
    res.status(500).json({ message: 'Server error adding comment' });
  }
};

/**
 * @desc    Delete comment from forum
 * @route   DELETE /api/community/:id/comments/:commentId
 * @access  Private
 */
exports.deleteComment = async (req, res) => {
  try {
    // Find forum post
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    // Find comment
    const comment = forum.comments.find(
      (comment) => comment._id.toString() === req.params.commentId
    );

    // Check if comment exists
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Get remove index
    const removeIndex = forum.comments
      .map((comment) => comment._id.toString())
      .indexOf(req.params.commentId);

    // Remove comment
    forum.comments.splice(removeIndex, 1);
    await forum.save();

    res.json(forum.comments);
  } catch (error) {
    console.error('Delete comment error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Forum post or comment not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting comment' });
  }
};

/**
 * @desc    Like or unlike a forum post
 * @route   PUT /api/community/:id/like
 * @access  Private
 */
exports.toggleLike = async (req, res) => {
  try {
    // Find forum post
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    // Check if post has already been liked by this user
    const alreadyLiked = forum.likes.some(
      (like) => like.toString() === req.user.id
    );

    if (alreadyLiked) {
      // Remove like
      forum.likes = forum.likes.filter(
        (like) => like.toString() !== req.user.id
      );
    } else {
      // Add like
      forum.likes.unshift(req.user.id);
    }

    await forum.save();

    res.json(forum.likes);
  } catch (error) {
    console.error('Toggle like error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Forum post not found' });
    }
    
    res.status(500).json({ message: 'Server error toggling like' });
  }
};

/**
 * @desc    Like or unlike a comment
 * @route   PUT /api/community/:id/comments/:commentId/like
 * @access  Private
 */
exports.toggleCommentLike = async (req, res) => {
  try {
    // Find forum post
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    // Find comment
    const comment = forum.comments.find(
      (comment) => comment._id.toString() === req.params.commentId
    );

    // Check if comment exists
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if comment has already been liked by this user
    const alreadyLiked = comment.likes.some(
      (like) => like.toString() === req.user.id
    );

    if (alreadyLiked) {
      // Remove like
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== req.user.id
      );
    } else {
      // Add like
      comment.likes.unshift(req.user.id);
    }

    await forum.save();

    res.json(comment.likes);
  } catch (error) {
    console.error('Toggle comment like error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Forum post or comment not found' });
    }
    
    res.status(500).json({ message: 'Server error toggling comment like' });
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/community/categories
 * @access  Public
 */
exports.getCategories = async (req, res) => {
  try {
    // Get unique categories from forum posts
    const categories = await Forum.distinct('category');
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};
