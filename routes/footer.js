const express = require('express');
const router = express.Router();
const Footer = require('../models/Footer');
const auth = require('../middleware/auth');

// Add Footer API (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      copyrightTitle,
      description,
      address,
      phone,
      email,
      links,
      socialMedia,
      quickLinks,
      additionalInfo,
    } = req.body;

    // Validation - copyrightTitle is required
    if (!copyrightTitle) {
      return res.status(400).json({
        success: false,
        message: 'Copyright title is required',
      });
    }

    // Create new footer
    const footer = new Footer({
      copyrightTitle,
      description,
      address,
      phone,
      email,
      links: links || [],
      socialMedia: socialMedia || [],
      quickLinks: quickLinks || [],
      additionalInfo,
    });

    await footer.save();

    res.status(201).json({
      success: true,
      message: 'Footer created successfully',
      data: footer,
    });
  } catch (error) {
    console.error('Footer creation error:', error);
    
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

// Get Footer API (Optional - for retrieving footer data)
router.get('/', async (req, res) => {
  try {
    const footer = await Footer.findOne().sort({ createdAt: -1 });
    
    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: footer,
    });
  } catch (error) {
    console.error('Get footer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update Footer API (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const footer = await Footer.findById(req.params.id);
    
    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer not found',
      });
    }

    const {
      copyrightTitle,
      description,
      address,
      phone,
      email,
      links,
      socialMedia,
      quickLinks,
      additionalInfo,
    } = req.body;

    if (copyrightTitle) footer.copyrightTitle = copyrightTitle;
    if (description !== undefined) footer.description = description;
    if (address !== undefined) footer.address = address;
    if (phone !== undefined) footer.phone = phone;
    if (email !== undefined) footer.email = email;
    if (links !== undefined) footer.links = links;
    if (socialMedia !== undefined) footer.socialMedia = socialMedia;
    if (quickLinks !== undefined) footer.quickLinks = quickLinks;
    if (additionalInfo !== undefined) footer.additionalInfo = additionalInfo;

    await footer.save();

    res.status(200).json({
      success: true,
      message: 'Footer updated successfully',
      data: footer,
    });
  } catch (error) {
    console.error('Footer update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;

