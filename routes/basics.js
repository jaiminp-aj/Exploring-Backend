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

    // Validation
    if (!introduction) {
      return res.status(400).json({
        success: false,
        message: 'Introduction is required',
      });
    }

    const { lang = 'en' } = req.body;
    
    // Prepare data with language support
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
    const { publishedOnly } = req.query;
    const language = req.language;
    
    let query = {};
    if (publishedOnly === 'true') {
      query.published = true;
    }

    const basics = await Basics.find(query).sort({ order: 1, createdAt: -1 });

    // Transform data based on requested language
    const transformed = transformArrayByLanguage(basics, language);

    res.status(200).json({
      success: true,
      count: basics.length,
      data: transformed,
      language,
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
    const basics = await Basics.findById(req.params.id);
    const language = req.language;
    
    if (!basics) {
      return res.status(404).json({
        success: false,
        message: 'Basics content not found',
      });
    }

    // Transform data based on requested language
    const transformed = transformByLanguage(basics, language);

    res.status(200).json({
      success: true,
      data: transformed,
      language,
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
      if (typeof introduction === 'string') {
        basics.introduction = { ...(basics.introduction || {}), [lang]: introduction };
      } else if (typeof introduction === 'object') {
        basics.introduction = { ...(basics.introduction || {}), ...introduction };
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

