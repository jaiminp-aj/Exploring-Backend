const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
  },
  subtitle: {
    type: String,
    trim: true,
  },
  backgroundImageUrl: {
    type: String,
    trim: true,
  },
  videoUrl: {
    type: String,
    trim: true,
  },
  ctaButtonText: {
    type: String,
    trim: true,
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

module.exports = mongoose.model('Banner', BannerSchema);

