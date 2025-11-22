const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'document', 'other'],
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true,
  },
  cloudinaryPublicId: {
    type: String,
    trim: true,
  },
  filePath: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  altText: {
    type: String,
    trim: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Media', MediaSchema);

