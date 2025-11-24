const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
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
  content: [{
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
  }],
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

// Validation: At least one language must have a description
FAQSchema.pre('validate', function(next) {
  if (!this.description?.en && !this.description?.es) {
    this.invalidate('description', 'FAQ description is required in at least one language');
  }
  next();
});

module.exports = mongoose.model('FAQ', FAQSchema);

