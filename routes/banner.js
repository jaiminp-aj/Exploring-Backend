const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const auth = require('../middleware/auth');

// Create Banner (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      backgroundImageUrl,
      videoUrl,
      ctaButtonText,
      ctaButtonLink,
      order,
      isActive,
    } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Banner title is required',
      });
    }

    // Create new banner
    const banner = new Banner({
      title,
      subtitle,
      backgroundImageUrl,
      videoUrl,
      ctaButtonText,
      ctaButtonLink,
      order: order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

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
router.get('/', async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    let query = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
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
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.status(200).json({
      success: true,
      data: banner,
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
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    const {
      title,
      subtitle,
      backgroundImageUrl,
      videoUrl,
      ctaButtonText,
      ctaButtonLink,
      order,
      isActive,
    } = req.body;

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (backgroundImageUrl !== undefined) banner.backgroundImageUrl = backgroundImageUrl;
    if (videoUrl !== undefined) banner.videoUrl = videoUrl;
    if (ctaButtonText !== undefined) banner.ctaButtonText = ctaButtonText;
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

