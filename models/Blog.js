const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  contentType: {
    type: String,
    enum: ['Blog Post', 'Video'],
    default: 'Blog Post',
    required: true,
  },
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
  excerpt: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  slug: {
    en: {
      type: String,
      trim: true,
      sparse: true,
    },
    es: {
      type: String,
      trim: true,
      sparse: true,
    },
  },
  featuredImageUrl: {
    type: String,
    trim: true,
  },
  content: {
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
    default: false,
  },
  author: {
    type: String,
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  views: {
    type: Number,
    default: 0,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    default: null,
  },
}, {
  timestamps: true,
});

// Validation: At least one language must have a title
BlogSchema.pre('validate', function(next) {
  if (!this.title?.en && !this.title?.es) {
    this.invalidate('title', 'Blog title is required in at least one language');
  }
  next();
});

// Auto-generate slug from title if not provided
BlogSchema.pre('save', function(next) {
  // Generate slug for English if not provided
  if (!this.slug?.en && this.title?.en) {
    this.slug = this.slug || {};
    this.slug.en = this.title.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  // Generate slug for Spanish if not provided
  if (!this.slug?.es && this.title?.es) {
    this.slug = this.slug || {};
    this.slug.es = this.title.es
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Blog', BlogSchema);

