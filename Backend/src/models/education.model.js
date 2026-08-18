const mongoose = require('mongoose');

const educationResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    topics: [{
      type: String,
      trim: true,
    }],
    resourceType: {
      type: String,
      required: true,
      enum: ['article', 'video', 'tutorial', 'ebook', 'webinar', 'tool', 'guide', 'other'],
    },
    fileUrl: {
      type: String,
      default: '',
    },
    views: {
      type: Number,
      default: 0,
    },
    ratings: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      value: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      date: {
        type: Date,
        default: Date.now,
      },
    }],
    averageRating: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create text index for search functionality
educationResourceSchema.index({ title: 'text', description: 'text', content: 'text', topics: 'text' });

const EducationResource = mongoose.model('EducationResource', educationResourceSchema);

module.exports = EducationResource;
