const express = require('express');
const router = express.Router();
const WhatIsIslam = require('../models/WhatIsIslam');
const auth = require('../middleware/auth');
const getLanguage = require('../middleware/language');
const { transformByLanguage, transformArrayByLanguage, prepareForSave } = require('../utils/languageHelper');

// Create What Is Islam (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      videoUrl,
      videoThumbnail,
      description1,
      published,
      order,
    } = req.body;

    // Validation
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required',
      });
    }

    if (!videoThumbnail) {
      return res.status(400).json({
        success: false,
        message: 'Video thumbnail is required',
      });
    }

    // Check if description exists (either as string or nested object)
    const hasDesc1 = description1 && (
      typeof description1 === 'string' || 
      (typeof description1 === 'object' && (description1.en || description1.es))
    );

    if (!hasDesc1) {
      return res.status(400).json({
        success: false,
        message: 'Description is required in at least one language',
      });
    }

    const { lang = 'en' } = req.body; // For backward compatibility
    
    // Prepare data with language support
    // prepareForSave handles both nested objects and flat strings
    const islamData = prepareForSave({
      videoUrl,
      videoThumbnail,
      description1,
      published: published !== undefined ? published : true,
      order: order !== undefined ? order : 0,
    }, lang);

    // Create new What Is Islam
    const whatIsIslam = new WhatIsIslam(islamData);

    await whatIsIslam.save();

    res.status(201).json({
      success: true,
      message: 'What Is Islam content created successfully',
      data: whatIsIslam,
    });
  } catch (error) {
    console.error('What Is Islam creation error:', error);
    
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

// Get All What Is Islam
router.get('/', getLanguage, async (req, res) => {
  try {
    const { publishedOnly, allLanguages } = req.query;
    const language = req.language;
    
    let query = {};
    if (publishedOnly === 'true') {
      query.published = true;
    }

    let whatIsIslam;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript objects without Mongoose transformations
      whatIsIslam = await WhatIsIslam.find(query).lean().sort({ order: 1, createdAt: -1 });
      transformed = whatIsIslam;
    } else {
      whatIsIslam = await WhatIsIslam.find(query).sort({ order: 1, createdAt: -1 });
      transformed = transformArrayByLanguage(whatIsIslam, language);
    }

    res.status(200).json({
      success: true,
      count: whatIsIslam.length,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
    });
  } catch (error) {
    console.error('Get What Is Islam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get Single What Is Islam by ID
router.get('/:id', getLanguage, async (req, res) => {
  try {
    const { allLanguages } = req.query;
    const language = req.language;
    
    let whatIsIslam;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript object without Mongoose transformations
      whatIsIslam = await WhatIsIslam.findById(req.params.id).lean();
      if (!whatIsIslam) {
        return res.status(404).json({
          success: false,
          message: 'What Is Islam content not found',
        });
      }
      transformed = whatIsIslam; // Already a plain object from lean()
    } else {
      whatIsIslam = await WhatIsIslam.findById(req.params.id);
      if (!whatIsIslam) {
        return res.status(404).json({
          success: false,
          message: 'What Is Islam content not found',
        });
      }
      transformed = transformByLanguage(whatIsIslam, language);
    }

    res.status(200).json({
      success: true,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
    });
  } catch (error) {
    console.error('Get What Is Islam error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid What Is Islam ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update What Is Islam (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const whatIsIslam = await WhatIsIslam.findById(req.params.id);
    
    if (!whatIsIslam) {
      return res.status(404).json({
        success: false,
        message: 'What Is Islam content not found',
      });
    }

    const {
      videoUrl,
      videoThumbnail,
      description1,
      published,
      order,
    } = req.body;

    const { lang = 'en' } = req.body;
    
    if (videoUrl !== undefined) whatIsIslam.videoUrl = videoUrl;
    if (videoThumbnail !== undefined) whatIsIslam.videoThumbnail = videoThumbnail;
    
    // Handle language-specific updates for description
    if (description1 !== undefined) {
      if (typeof description1 === 'object' && (description1.en !== undefined || description1.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        whatIsIslam.description1 = { ...(whatIsIslam.description1 || {}), ...description1 };
      } else if (typeof description1 === 'string') {
        // Old format: single string value - update for specified language
        whatIsIslam.description1 = { ...(whatIsIslam.description1 || {}), [lang]: description1 };
      }
    }
    
    if (published !== undefined) whatIsIslam.published = published;
    if (order !== undefined) whatIsIslam.order = order;

    await whatIsIslam.save();

    res.status(200).json({
      success: true,
      message: 'What Is Islam content updated successfully',
      data: whatIsIslam,
    });
  } catch (error) {
    console.error('What Is Islam update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid What Is Islam ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete What Is Islam (Protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const whatIsIslam = await WhatIsIslam.findByIdAndDelete(req.params.id);
    
    if (!whatIsIslam) {
      return res.status(404).json({
        success: false,
        message: 'What Is Islam content not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'What Is Islam content deleted successfully',
      data: whatIsIslam,
    });
  } catch (error) {
    console.error('What Is Islam deletion error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid What Is Islam ID',
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

