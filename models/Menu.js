const mongoose = require('mongoose');

// Delete the model if it already exists to avoid schema conflicts
if (mongoose.models.Menu) {
  delete mongoose.models.Menu;
}

const MenuSchema = new mongoose.Schema({
  menuTitle: {
    en: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
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

// Validation: At least one language must have a title
MenuSchema.pre('validate', function(next) {
  if (!this.menuTitle?.en && !this.menuTitle?.es) {
    this.invalidate('menuTitle', 'Menu title is required in at least one language');
  }
  next();
});

module.exports = mongoose.model('Menu', MenuSchema);

