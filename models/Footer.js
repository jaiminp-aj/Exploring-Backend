const mongoose = require('mongoose');

const FooterSchema = new mongoose.Schema({
  copyrightTitle: {
    type: String,
    required: [true, 'Copyright title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  links: [{
    title: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
  }],
  socialMedia: [{
    platform: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
  }],
  quickLinks: [{
    title: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
  }],
  additionalInfo: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Footer', FooterSchema);

