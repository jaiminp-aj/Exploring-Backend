const mongoose = require('mongoose');

const FooterSchema = new mongoose.Schema({
  copyrightTitle: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  description: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  address: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
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
      en: {
        type: String,
        trim: true,
      },
      es: {
        type: String,
        trim: true,
      },
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
      en: {
        type: String,
        trim: true,
      },
      es: {
        type: String,
        trim: true,
      },
    },
    url: {
      type: String,
      trim: true,
    },
  }],
  additionalInfo: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
}, {
  timestamps: true,
});

// Validation: At least one language must have a copyright title
FooterSchema.pre('validate', function(next) {
  if (!this.copyrightTitle?.en && !this.copyrightTitle?.es) {
    this.invalidate('copyrightTitle', 'Copyright title is required in at least one language');
  }
  next();
});

module.exports = mongoose.model('Footer', FooterSchema);

