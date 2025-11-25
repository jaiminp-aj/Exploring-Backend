const express = require('express');
const router = express.Router();
const WhatIsQuran = require('../models/WhatIsQuran');
const auth = require('../middleware/auth');
const getLanguage = require('../middleware/language');
const { transformByLanguage, transformArrayByLanguage, prepareForSave } = require('../utils/languageHelper');

// Create What Is Quran (Protected route)
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

    // Check if descriptions exist (either as string or nested object)
    const hasDesc1 = description1 && (
      typeof description1 === 'string' || 
      (typeof description1 === 'object' && (description1.en || description1.es))
    );
    const hasDesc2 = description2 && (
      typeof description2 === 'string' || 
      (typeof description2 === 'object' && (description2.en || description2.es))
    );
    const hasDesc3 = description3 && (
      typeof description3 === 'string' || 
      (typeof description3 === 'object' && (description3.en || description3.es))
    );

    if (!hasDesc1 || !hasDesc2 || !hasDesc3) {
      return res.status(400).json({
        success: false,
        message: 'All three descriptions are required in at least one language',
      });
    }

    const { lang = 'en' } = req.body; // For backward compatibility
    
    // Prepare data with language support
    // prepareForSave handles both nested objects and flat strings
    const quranData = prepareForSave({
      videoUrl,
      videoThumbnail,
      description1,
      description2,
      description3,
      published: published !== undefined ? published : true,
      order: order !== undefined ? order : 0,
    }, lang);

    // Create new What Is Quran
    const whatIsQuran = new WhatIsQuran(quranData);

    await whatIsQuran.save();

    res.status(201).json({
      success: true,
      message: 'What Is Quran content created successfully',
      data: whatIsQuran,
    });
  } catch (error) {
    console.error('What Is Quran creation error:', error);
    
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

// Get All What Is Quran
router.get('/', getLanguage, async (req, res) => {
  try {
    const { publishedOnly, allLanguages } = req.query;
    const language = req.language;
    
    let query = {};
    if (publishedOnly === 'true') {
      query.published = true;
    }

    let whatIsQuran;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript objects without Mongoose transformations
      whatIsQuran = await WhatIsQuran.find(query).lean().sort({ order: 1, createdAt: -1 });
      transformed = whatIsQuran;
    } else {
      whatIsQuran = await WhatIsQuran.find(query).sort({ order: 1, createdAt: -1 });
      transformed = transformArrayByLanguage(whatIsQuran, language);
    }

    res.status(200).json({
      success: true,
      count: whatIsQuran.length,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
    });
  } catch (error) {
    console.error('Get What Is Quran error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get Single What Is Quran by ID
router.get('/:id', getLanguage, async (req, res) => {
  try {
    const { allLanguages } = req.query;
    const language = req.language;
    
    let whatIsQuran;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript object without Mongoose transformations
      whatIsQuran = await WhatIsQuran.findById(req.params.id).lean();
      if (!whatIsQuran) {
        return res.status(404).json({
          success: false,
          message: 'What Is Quran content not found',
        });
      }
      transformed = whatIsQuran; // Already a plain object from lean()
    } else {
      whatIsQuran = await WhatIsQuran.findById(req.params.id);
      if (!whatIsQuran) {
        return res.status(404).json({
          success: false,
          message: 'What Is Quran content not found',
        });
      }
      transformed = transformByLanguage(whatIsQuran, language);
    }

    res.status(200).json({
      success: true,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
    });
  } catch (error) {
    console.error('Get What Is Quran error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid What Is Quran ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update What Is Quran (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const whatIsQuran = await WhatIsQuran.findById(req.params.id);
    
    if (!whatIsQuran) {
      return res.status(404).json({
        success: false,
        message: 'What Is Quran content not found',
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
    
    if (videoUrl !== undefined) whatIsQuran.videoUrl = videoUrl;
    if (videoThumbnail !== undefined) whatIsQuran.videoThumbnail = videoThumbnail;
    
    // Handle language-specific updates for descriptions
    if (description1 !== undefined) {
      if (typeof description1 === 'object' && (description1.en !== undefined || description1.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        whatIsQuran.description1 = { ...(whatIsQuran.description1 || {}), ...description1 };
      } else if (typeof description1 === 'string') {
        // Old format: single string value - update for specified language
        whatIsQuran.description1 = { ...(whatIsQuran.description1 || {}), [lang]: description1 };
      }
    }
    if (description2 !== undefined) {
      if (typeof description2 === 'object' && (description2.en !== undefined || description2.es !== undefined)) {
        whatIsQuran.description2 = { ...(whatIsQuran.description2 || {}), ...description2 };
      } else if (typeof description2 === 'string') {
        whatIsQuran.description2 = { ...(whatIsQuran.description2 || {}), [lang]: description2 };
      }
    }
    if (description3 !== undefined) {
      if (typeof description3 === 'object' && (description3.en !== undefined || description3.es !== undefined)) {
        whatIsQuran.description3 = { ...(whatIsQuran.description3 || {}), ...description3 };
      } else if (typeof description3 === 'string') {
        whatIsQuran.description3 = { ...(whatIsQuran.description3 || {}), [lang]: description3 };
      }
    }
    
    if (published !== undefined) whatIsQuran.published = published;
    if (order !== undefined) whatIsQuran.order = order;

    await whatIsQuran.save();

    res.status(200).json({
      success: true,
      message: 'What Is Quran content updated successfully',
      data: whatIsQuran,
    });
  } catch (error) {
    console.error('What Is Quran update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid What Is Quran ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete What Is Quran (Protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const whatIsQuran = await WhatIsQuran.findByIdAndDelete(req.params.id);
    
    if (!whatIsQuran) {
      return res.status(404).json({
        success: false,
        message: 'What Is Quran content not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'What Is Quran content deleted successfully',
      data: whatIsQuran,
    });
  } catch (error) {
    console.error('What Is Quran deletion error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid What Is Quran ID',
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

