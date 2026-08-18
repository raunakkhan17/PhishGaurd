const mongoose = require('mongoose');

const flaggedWebsiteSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['phishing', 'malware', 'scam', 'fake-shop', 'bank-phishing', 'streaming-phishing', 'crypto-scam', 'ransomware', 'other'],
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    screenshot: {
      type: String,
      default: '',
    },
    evidence: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    dateReviewed: {
      type: Date,
    },
    reports: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      comment: String,
      date: {
        type: Date,
        default: Date.now,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create text index for search functionality
flaggedWebsiteSchema.index({ url: 'text', title: 'text', description: 'text', category: 'text' });

const FlaggedWebsite = mongoose.model('FlaggedWebsite', flaggedWebsiteSchema);

module.exports = FlaggedWebsite;
