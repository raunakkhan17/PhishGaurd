const mongoose = require('mongoose');

// WARNING: THIS MODEL STORES PASSWORDS IN PLAINTEXT
// This is extremely insecure and should NEVER be used in production environments
// This is only for specific testing/educational purposes

const DataEntrySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      // SECURITY RISK: No hashing for this field
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DataEntry', DataEntrySchema);
