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
      description2,
      description3,
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

    if (!description1 || !description2 || !description3) {
      return res.status(400).json({
        success: false,
        message: 'All three descriptions are required',
      });
    }

    const { lang = 'en' } = req.body;
    
    // Prepare data with language support
    const islamData = prepareForSave({
      videoUrl,
      videoThumbnail,
      description1,
      description2,
      description3,
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
    const { publishedOnly } = req.query;
    const language = req.language;
    
    let query = {};
    if (publishedOnly === 'true') {
      query.published = true;
    }

    const whatIsIslam = await WhatIsIslam.find(query).sort({ order: 1, createdAt: -1 });

    // Transform data based on requested language
    const transformed = transformArrayByLanguage(whatIsIslam, language);

    res.status(200).json({
      success: true,
      count: whatIsIslam.length,
      data: transformed,
      language,
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
    const whatIsIslam = await WhatIsIslam.findById(req.params.id);
    const language = req.language;
    
    if (!whatIsIslam) {
      return res.status(404).json({
        success: false,
        message: 'What Is Islam content not found',
      });
    }

    // Transform data based on requested language
    const transformed = transformByLanguage(whatIsIslam, language);

    res.status(200).json({
      success: true,
      data: transformed,
      language,
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
      description2,
      description3,
      published,
      order,
    } = req.body;

    const { lang = 'en' } = req.body;
    
    if (videoUrl !== undefined) whatIsIslam.videoUrl = videoUrl;
    if (videoThumbnail !== undefined) whatIsIslam.videoThumbnail = videoThumbnail;
    
    // Handle language-specific updates for descriptions
    if (description1 !== undefined) {
      if (typeof description1 === 'string') {
        whatIsIslam.description1 = { ...(whatIsIslam.description1 || {}), [lang]: description1 };
      } else if (typeof description1 === 'object') {
        whatIsIslam.description1 = { ...(whatIsIslam.description1 || {}), ...description1 };
      }
    }
    if (description2 !== undefined) {
      if (typeof description2 === 'string') {
        whatIsIslam.description2 = { ...(whatIsIslam.description2 || {}), [lang]: description2 };
      } else if (typeof description2 === 'object') {
        whatIsIslam.description2 = { ...(whatIsIslam.description2 || {}), ...description2 };
      }
    }
    if (description3 !== undefined) {
      if (typeof description3 === 'string') {
        whatIsIslam.description3 = { ...(whatIsIslam.description3 || {}), [lang]: description3 };
      } else if (typeof description3 === 'object') {
        whatIsIslam.description3 = { ...(whatIsIslam.description3 || {}), ...description3 };
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

