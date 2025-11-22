const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    trim: true,
    default: '',
  },
  logoUrl: {
    type: String,
    trim: true,
    default: '',
  },
  faviconUrl: {
    type: String,
    trim: true,
    default: '',
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  contactPhone: {
    type: String,
    trim: true,
    default: '',
  },
  
  // Social Media Links
  socialMedia: {
    facebook: {
      type: String,
      trim: true,
      default: '',
    },
    twitter: {
      type: String,
      trim: true,
      default: '',
    },
    instagram: {
      type: String,
      trim: true,
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    youtube: {
      type: String,
      trim: true,
      default: '',
    },
  },
  
  // Additional Settings
  metaDescription: {
    type: String,
    trim: true,
    default: '',
  },
  metaKeywords: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  timezone: {
    type: String,
    trim: true,
    default: 'UTC',
  },
  language: {
    type: String,
    trim: true,
    default: 'en',
  },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema);

