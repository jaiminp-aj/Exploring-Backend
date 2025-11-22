const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  contentType: {
    type: String,
    enum: ['Blog Post', 'Video'],
    default: 'Blog Post',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
  },
  excerpt: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  featuredImageUrl: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    trim: true,
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
}, {
  timestamps: true,
});

// Auto-generate slug from title if not provided
BlogSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Blog', BlogSchema);

