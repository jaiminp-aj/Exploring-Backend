const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
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

// Validation: At least one content item must exist and have valid data
FAQSchema.pre('validate', function(next) {
  if (!this.content || this.content.length === 0) {
    this.invalidate('content', 'FAQ must have at least one content item');
    return next(new Error('FAQ must have at least one content item'));
  }
  
  // Validate each content item
  for (const item of this.content) {
    // Check if title exists in at least one language
    const hasTitle = (item.title && (
      (item.title.en && item.title.en.trim()) || 
      (item.title.es && item.title.es.trim())
    ));
    
    // Check if description exists in at least one language
    const hasDescription = (item.description && (
      (item.description.en && item.description.en.trim()) || 
      (item.description.es && item.description.es.trim())
    ));
    
    if (!hasTitle) {
      this.invalidate('content', 'FAQ content title is required in at least one language');
      return next(new Error('FAQ content title is required in at least one language'));
    }
    
    if (!hasDescription) {
      this.invalidate('content', 'FAQ content description is required in at least one language');
      return next(new Error('FAQ content description is required in at least one language'));
    }
  }
  
  next();
});

module.exports = mongoose.model('FAQ', FAQSchema);

