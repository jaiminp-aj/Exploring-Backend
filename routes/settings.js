const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');

// Get Settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Create/Update Settings (Protected route)
// Since there should only be one settings document, this acts as both create and update
router.post('/', auth, async (req, res) => {
  try {
    const {
      siteName,
      logoUrl,
      faviconUrl,
      contactEmail,
      contactPhone,
      socialMedia,
      metaDescription,
      metaKeywords,
      address,
      timezone,
      language,
    } = req.body;

    // Get existing settings or create new one
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create new settings
      settings = new Settings({
        siteName,
        logoUrl,
        faviconUrl,
        contactEmail,
        contactPhone,
        socialMedia: socialMedia || {},
        metaDescription,
        metaKeywords,
        address,
        timezone,
        language,
      });
    } else {
      // Update existing settings
      if (siteName !== undefined) settings.siteName = siteName;
      if (logoUrl !== undefined) settings.logoUrl = logoUrl;
      if (faviconUrl !== undefined) settings.faviconUrl = faviconUrl;
      if (contactEmail !== undefined) settings.contactEmail = contactEmail;
      if (contactPhone !== undefined) settings.contactPhone = contactPhone;
      if (metaDescription !== undefined) settings.metaDescription = metaDescription;
      if (metaKeywords !== undefined) settings.metaKeywords = metaKeywords;
      if (address !== undefined) settings.address = address;
      if (timezone !== undefined) settings.timezone = timezone;
      if (language !== undefined) settings.language = language;
      
      // Update social media links
      if (socialMedia !== undefined) {
        if (socialMedia.facebook !== undefined) settings.socialMedia.facebook = socialMedia.facebook;
        if (socialMedia.twitter !== undefined) settings.socialMedia.twitter = socialMedia.twitter;
        if (socialMedia.instagram !== undefined) settings.socialMedia.instagram = socialMedia.instagram;
        if (socialMedia.linkedin !== undefined) settings.socialMedia.linkedin = socialMedia.linkedin;
        if (socialMedia.youtube !== undefined) settings.socialMedia.youtube = socialMedia.youtube;
      }
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings saved successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Settings save error:', error);
    
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

// Update Settings (Protected route)
router.put('/', auth, async (req, res) => {
  try {
    const {
      siteName,
      logoUrl,
      faviconUrl,
      contactEmail,
      contactPhone,
      socialMedia,
      metaDescription,
      metaKeywords,
      address,
      timezone,
      language,
    } = req.body;

    // Get existing settings or create new one
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({});
    }

    // Update fields
    if (siteName !== undefined) settings.siteName = siteName;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (faviconUrl !== undefined) settings.faviconUrl = faviconUrl;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (metaDescription !== undefined) settings.metaDescription = metaDescription;
    if (metaKeywords !== undefined) settings.metaKeywords = metaKeywords;
    if (address !== undefined) settings.address = address;
    if (timezone !== undefined) settings.timezone = timezone;
    if (language !== undefined) settings.language = language;
    
    // Update social media links
    if (socialMedia !== undefined) {
      if (socialMedia.facebook !== undefined) settings.socialMedia.facebook = socialMedia.facebook;
      if (socialMedia.twitter !== undefined) settings.socialMedia.twitter = socialMedia.twitter;
      if (socialMedia.instagram !== undefined) settings.socialMedia.instagram = socialMedia.instagram;
      if (socialMedia.linkedin !== undefined) settings.socialMedia.linkedin = socialMedia.linkedin;
      if (socialMedia.youtube !== undefined) settings.socialMedia.youtube = socialMedia.youtube;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    
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

// Update General Settings Only (Protected route)
router.put('/general', auth, async (req, res) => {
  try {
    const {
      siteName,
      logoUrl,
      faviconUrl,
      contactEmail,
      contactPhone,
      metaDescription,
      metaKeywords,
      address,
      timezone,
      language,
    } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({});
    }

    if (siteName !== undefined) settings.siteName = siteName;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (faviconUrl !== undefined) settings.faviconUrl = faviconUrl;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (metaDescription !== undefined) settings.metaDescription = metaDescription;
    if (metaKeywords !== undefined) settings.metaKeywords = metaKeywords;
    if (address !== undefined) settings.address = address;
    if (timezone !== undefined) settings.timezone = timezone;
    if (language !== undefined) settings.language = language;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('General settings update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update Social Media Links Only (Protected route)
router.put('/social-media', auth, async (req, res) => {
  try {
    const { socialMedia } = req.body;

    if (!socialMedia) {
      return res.status(400).json({
        success: false,
        message: 'Social media links are required',
      });
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({});
    }

    if (socialMedia.facebook !== undefined) settings.socialMedia.facebook = socialMedia.facebook;
    if (socialMedia.twitter !== undefined) settings.socialMedia.twitter = socialMedia.twitter;
    if (socialMedia.instagram !== undefined) settings.socialMedia.instagram = socialMedia.instagram;
    if (socialMedia.linkedin !== undefined) settings.socialMedia.linkedin = socialMedia.linkedin;
    if (socialMedia.youtube !== undefined) settings.socialMedia.youtube = socialMedia.youtube;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Social media links updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Social media update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete Settings (Protected route) - Resets to default
router.delete('/', auth, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found',
      });
    }

    // Reset to default values
    settings.siteName = '';
    settings.logoUrl = '';
    settings.faviconUrl = '';
    settings.contactEmail = '';
    settings.contactPhone = '';
    settings.socialMedia = {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
    };
    settings.metaDescription = '';
    settings.metaKeywords = '';
    settings.address = '';
    settings.timezone = 'UTC';
    settings.language = 'en';

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings reset to default successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Settings reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;

