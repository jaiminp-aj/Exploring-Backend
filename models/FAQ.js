const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
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

// Validation: At least one language must have a title and description
FAQSchema.pre('validate', function(next) {
  // Check if title exists in at least one language
  const hasTitle = (this.title && (
    (this.title.en && this.title.en.trim()) || 
    (this.title.es && this.title.es.trim())
  ));
  
  // Check if description exists in at least one language
  const hasDescription = (this.description && (
    (this.description.en && this.description.en.trim()) || 
    (this.description.es && this.description.es.trim())
  ));
  
  if (!hasTitle) {
    this.invalidate('title', 'FAQ title is required in at least one language');
    return next(new Error('FAQ title is required in at least one language'));
  }
  
  if (!hasDescription) {
    this.invalidate('description', 'FAQ description is required in at least one language');
    return next(new Error('FAQ description is required in at least one language'));
  }
  
  next();
});

module.exports = mongoose.model('FAQ', FAQSchema);

