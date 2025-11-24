const mongoose = require('mongoose');

const WhatIsIslamSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required'],
    trim: true,
  },
  videoThumbnail: {
    type: String,
    required: [true, 'Video thumbnail is required'],
    trim: true,
  },
  description1: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  description2: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  description3: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  published: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Validation: At least one language must have descriptions
WhatIsIslamSchema.pre('validate', function(next) {
  if ((!this.description1?.en && !this.description1?.es) ||
      (!this.description2?.en && !this.description2?.es) ||
      (!this.description3?.en && !this.description3?.es)) {
    this.invalidate('description', 'All descriptions are required in at least one language');
  }
  next();
});

module.exports = mongoose.model('WhatIsIslam', WhatIsIslamSchema);

