const mongoose = require('mongoose');

const BasicsSchema = new mongoose.Schema({
  introduction: {
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

// Validation: At least one language must have an introduction
BasicsSchema.pre('validate', function(next) {
  if (!this.introduction?.en && !this.introduction?.es) {
    this.invalidate('introduction', 'Introduction is required in at least one language');
  }
  next();
});

module.exports = mongoose.model('Basics', BasicsSchema);

