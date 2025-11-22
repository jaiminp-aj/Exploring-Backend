const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  menuTitle: {
    type: String,
    required: [true, 'Menu title is required'],
    trim: true,
  },
  linkUrl: {
    type: String,
    required: [true, 'Link URL is required'],
    trim: true,
  },
  visibleOnSite: {
    type: Boolean,
    default: true,
  },
  openInNewTab: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Menu', MenuSchema);

