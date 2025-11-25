const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  subtitle: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  desktopBackgroundImageUrl: {
    type: String,
    trim: true,
  },
  mobileBackgroundImageUrl: {
    type: String,
    trim: true,
  },
  videoUrl: {
    type: String,
    trim: true,
  },
  ctaButtonText: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  ctaButtonLink: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Validation: At least one language must have a title
BannerSchema.pre('validate', function(next) {
  if (!this.title?.en && !this.title?.es) {
    this.invalidate('title', 'Banner title is required in at least one language');
  }
  next();
});

module.exports = mongoose.model('Banner', BannerSchema);

