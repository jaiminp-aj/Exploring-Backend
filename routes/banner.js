const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const auth = require('../middleware/auth');
const getLanguage = require('../middleware/language');
const { transformByLanguage, transformArrayByLanguage, prepareForSave } = require('../utils/languageHelper');

// Create Banner (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      desktopBackgroundImageUrl,
      mobileBackgroundImageUrl,
      backgroundImageUrl, // For backward compatibility
      videoUrl,
      ctaButtonText,
      ctaButtonLink,
      order,
      isActive,
      lang = 'en', // For backward compatibility
    } = req.body;

    // Validation - check if title exists (either as string or nested object)
    const hasTitle = title && (
      typeof title === 'string' || 
      (typeof title === 'object' && (title.en || title.es))
    );
    
    if (!hasTitle) {
      return res.status(400).json({
        success: false,
        message: 'Banner title is required in at least one language',
      });
    }

    // Prepare data with language support
    // prepareForSave handles both nested objects and flat strings
    const bannerData = prepareForSave({
      title,
      subtitle,
      desktopBackgroundImageUrl: desktopBackgroundImageUrl || backgroundImageUrl, // Support both new and old field names
      mobileBackgroundImageUrl,
      videoUrl,
      ctaButtonText,
      ctaButtonLink,
      order: order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true,
    }, lang);

    // Create new banner
    const banner = new Banner(bannerData);

    await banner.save();

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner,
    });
  } catch (error) {
    console.error('Banner creation error:', error);
    
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

// Get All Banners
router.get('/', getLanguage, async (req, res) => {
  try {
    const { activeOnly, allLanguages } = req.query;
    const language = req.language;
    
    let query = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    let banners;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript objects without Mongoose transformations
      // This ensures nested language objects are preserved exactly as stored
      banners = await Banner.find(query).lean().sort({ order: 1, createdAt: -1 });
      transformed = banners;
    } else {
      banners = await Banner.find(query).sort({ order: 1, createdAt: -1 });
      transformed = transformArrayByLanguage(banners, language);
    }

    res.status(200).json({
      success: true,
      count: banners.length,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get Single Banner by ID
router.get('/:id', getLanguage, async (req, res) => {
  try {
    const { allLanguages } = req.query;
    const language = req.language;
    
    let banner;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript object without Mongoose transformations
      banner = await Banner.findById(req.params.id).lean();
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found',
        });
      }
      transformed = banner; // Already a plain object from lean()
    } else {
      banner = await Banner.findById(req.params.id);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found',
        });
      }
      transformed = transformByLanguage(banner, language);
    }

    res.status(200).json({
      success: true,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
    });
  } catch (error) {
    console.error('Get banner error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update Banner (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    const { lang = 'en' } = req.body;
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    const {
      title,
      subtitle,
      desktopBackgroundImageUrl,
      mobileBackgroundImageUrl,
      backgroundImageUrl, // For backward compatibility
      videoUrl,
      ctaButtonText,
      ctaButtonLink,
      order,
      isActive,
    } = req.body;

    // Handle language-specific updates for translatable fields
    if (title !== undefined) {
      if (typeof title === 'object' && (title.en !== undefined || title.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        banner.title = { ...(banner.title || {}), ...title };
      } else if (typeof title === 'string') {
        // Old format: single string value - update for specified language
        banner.title = { ...(banner.title || {}), [lang]: title };
      }
    }
    
    if (subtitle !== undefined) {
      if (typeof subtitle === 'object' && (subtitle.en !== undefined || subtitle.es !== undefined)) {
        banner.subtitle = { ...(banner.subtitle || {}), ...subtitle };
      } else if (typeof subtitle === 'string') {
        banner.subtitle = { ...(banner.subtitle || {}), [lang]: subtitle };
      }
    }
    
    if (ctaButtonText !== undefined) {
      if (typeof ctaButtonText === 'object' && (ctaButtonText.en !== undefined || ctaButtonText.es !== undefined)) {
        banner.ctaButtonText = { ...(banner.ctaButtonText || {}), ...ctaButtonText };
      } else if (typeof ctaButtonText === 'string') {
        banner.ctaButtonText = { ...(banner.ctaButtonText || {}), [lang]: ctaButtonText };
      }
    }
    
    // Handle desktop background image (support both new and old field names)
    if (desktopBackgroundImageUrl !== undefined) {
      banner.desktopBackgroundImageUrl = desktopBackgroundImageUrl;
    } else if (backgroundImageUrl !== undefined) {
      // Backward compatibility: if old field name is used, set desktop image
      banner.desktopBackgroundImageUrl = backgroundImageUrl;
    }
    if (mobileBackgroundImageUrl !== undefined) banner.mobileBackgroundImageUrl = mobileBackgroundImageUrl;
    if (videoUrl !== undefined) banner.videoUrl = videoUrl;
    if (ctaButtonLink !== undefined) banner.ctaButtonLink = ctaButtonLink;
    if (order !== undefined) banner.order = order;
    if (isActive !== undefined) banner.isActive = isActive;

    await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner,
    });
  } catch (error) {
    console.error('Banner update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete Banner (Protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
      data: banner,
    });
  } catch (error) {
    console.error('Banner deletion error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID',
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

