const mongoose = require('mongoose');

const FooterSchema = new mongoose.Schema({
  // Powered By Section
  poweredBy: {
    exploringIslam: {
      logoUrl: {
        type: String,
        trim: true,
        default: '',
        validate: {
          validator: function(v) {
            // Allow empty string or valid URL
            if (!v || v === '') return true;
            try {
              new URL(v);
              return true;
            } catch {
              return false;
            }
          },
          message: 'Logo URL must be a valid URL'
        },
      },
      link: {
        type: String,
        trim: true,
        default: '',
        validate: {
          validator: function(v) {
            // Allow empty string or valid URL
            if (!v || v === '') return true;
            try {
              new URL(v);
              return true;
            } catch {
              return false;
            }
          },
          message: 'Link must be a valid URL'
        },
      },
    },
    imi: {
      logoUrl: {
        type: String,
        trim: true,
        default: '',
        validate: {
          validator: function(v) {
            // Allow empty string or valid URL
            if (!v || v === '') return true;
            try {
              new URL(v);
              return true;
            } catch {
              return false;
            }
          },
          message: 'Logo URL must be a valid URL'
        },
      },
      link: {
        type: String,
        trim: true,
        default: '',
        validate: {
          validator: function(v) {
            // Allow empty string or valid URL
            if (!v || v === '') return true;
            try {
              new URL(v);
              return true;
            } catch {
              return false;
            }
          },
          message: 'Link must be a valid URL'
        },
      },
    },
  },
  // Follow Sections
  followSections: {
    exploringIslam: {
      socialMedia: [{
        platform: {
          type: String,
          enum: ['youtube', 'instagram', 'twitter', 'facebook', 'linkedin'],
          required: true,
        },
        url: {
          type: String,
          trim: true,
          required: true,
          validate: {
            validator: function(v) {
              try {
                new URL(v);
                return true;
              } catch {
                return false;
              }
            },
            message: 'Social media URL must be a valid URL'
          },
        },
      }],
    },
    imi: {
      socialMedia: [{
        platform: {
          type: String,
          enum: ['youtube', 'instagram', 'twitter', 'facebook', 'linkedin'],
          required: true,
        },
        url: {
          type: String,
          trim: true,
          required: true,
          validate: {
            validator: function(v) {
              try {
                new URL(v);
                return true;
              } catch {
                return false;
              }
            },
            message: 'Social media URL must be a valid URL'
          },
        },
      }],
    },
  },
  // Legacy fields (kept for backward compatibility)
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

// Validation removed - footer can exist without copyright title for new structure

module.exports = mongoose.model('Footer', FooterSchema);

