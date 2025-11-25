const express = require('express');
const router = express.Router();
const Basics = require('../models/Basics');
const auth = require('../middleware/auth');
const getLanguage = require('../middleware/language');
const { transformByLanguage, transformArrayByLanguage, prepareForSave } = require('../utils/languageHelper');

// Create Basics (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      introduction,
      published,
      order,
    } = req.body;

    // Validation - check if introduction exists (either as string or nested object)
    const hasIntroduction = introduction && (
      typeof introduction === 'string' || 
      (typeof introduction === 'object' && (introduction.en || introduction.es))
    );
    
    if (!hasIntroduction) {
      return res.status(400).json({
        success: false,
        message: 'Introduction is required in at least one language',
      });
    }

    const { lang = 'en' } = req.body; // For backward compatibility
    
    // Prepare data with language support
    // prepareForSave handles both nested objects and flat strings
    const basicsData = prepareForSave({
      introduction,
      published: published !== undefined ? published : true,
      order: order !== undefined ? order : 0,
    }, lang);

    // Create new Basics
    const basics = new Basics(basicsData);

    await basics.save();

    res.status(201).json({
      success: true,
      message: 'Basics content created successfully',
      data: basics,
    });
  } catch (error) {
    console.error('Basics creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get All Basics
router.get('/', getLanguage, async (req, res) => {
  try {
    const { publishedOnly, allLanguages } = req.query;
    const language = req.language;
    
    let query = {};
    if (publishedOnly === 'true') {
      query.published = true;
    }

    let basics;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript objects without Mongoose transformations
      basics = await Basics.find(query).lean().sort({ order: 1, createdAt: -1 });
      transformed = basics;
    } else {
      basics = await Basics.find(query).sort({ order: 1, createdAt: -1 });
      transformed = transformArrayByLanguage(basics, language);
    }

    res.status(200).json({
      success: true,
      count: basics.length,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
    });
  } catch (error) {
    console.error('Get Basics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get Single Basics by ID
router.get('/:id', getLanguage, async (req, res) => {
  try {
    const { allLanguages } = req.query;
    const language = req.language;
    
    let basics;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript object without Mongoose transformations
      basics = await Basics.findById(req.params.id).lean();
      if (!basics) {
        return res.status(404).json({
          success: false,
          message: 'Basics content not found',
        });
      }
      transformed = basics; // Already a plain object from lean()
    } else {
      basics = await Basics.findById(req.params.id);
      if (!basics) {
        return res.status(404).json({
          success: false,
          message: 'Basics content not found',
        });
      }
      transformed = transformByLanguage(basics, language);
    }

    res.status(200).json({
      success: true,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
    });
  } catch (error) {
    console.error('Get Basics error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Basics ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update Basics (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const basics = await Basics.findById(req.params.id);
    
    if (!basics) {
      return res.status(404).json({
        success: false,
        message: 'Basics content not found',
      });
    }

    const {
      introduction,
      published,
      order,
    } = req.body;

    const { lang = 'en' } = req.body;
    
    // Handle language-specific updates
    if (introduction !== undefined) {
      if (typeof introduction === 'object' && (introduction.en !== undefined || introduction.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        basics.introduction = { ...(basics.introduction || {}), ...introduction };
      } else if (typeof introduction === 'string') {
        // Old format: single string value - update for specified language
        basics.introduction = { ...(basics.introduction || {}), [lang]: introduction };
      }
    }
    
    if (published !== undefined) basics.published = published;
    if (order !== undefined) basics.order = order;

    await basics.save();

    res.status(200).json({
      success: true,
      message: 'Basics content updated successfully',
      data: basics,
    });
  } catch (error) {
    console.error('Basics update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Basics ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete Basics (Protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const basics = await Basics.findByIdAndDelete(req.params.id);
    
    if (!basics) {
      return res.status(404).json({
        success: false,
        message: 'Basics content not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Basics content deleted successfully',
      data: basics,
    });
  } catch (error) {
    console.error('Basics deletion error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Basics ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;

