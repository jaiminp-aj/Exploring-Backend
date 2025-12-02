const express = require('express');
const router = express.Router();
const Footer = require('../models/Footer');
const auth = require('../middleware/auth');
const getLanguage = require('../middleware/language');
const { transformByLanguage, prepareForSave } = require('../utils/languageHelper');

// Add Footer API (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      poweredBy,
      followSections,
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

    const { lang = 'en' } = req.body; // For backward compatibility
    
    // Prepare data with language support
    const footerData = {
      poweredBy: poweredBy || {},
      followSections: followSections || {},
      ...prepareForSave({
        copyrightTitle,
        description,
        address,
        phone,
        email,
        links: links || [],
        socialMedia: socialMedia || [],
        quickLinks: quickLinks || [],
        additionalInfo,
      }, lang),
    };

    // Create new footer
    const footer = new Footer(footerData);

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
router.get('/', getLanguage, async (req, res) => {
  try {
    const footer = await Footer.findOne().sort({ createdAt: -1 });
    const language = req.language;
    
    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer not found',
      });
    }

    // Transform data based on requested language
    const transformed = transformByLanguage(footer, language);

    res.status(200).json({
      success: true,
      data: transformed,
      language,
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
      poweredBy,
      followSections,
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

    const { lang = 'en' } = req.body;
    
    // Handle new footer structure
    if (poweredBy !== undefined) {
      footer.poweredBy = poweredBy;
    }
    
    if (followSections !== undefined) {
      footer.followSections = followSections;
    }
    
    // Handle language-specific updates for translatable fields
    if (copyrightTitle !== undefined) {
      if (typeof copyrightTitle === 'object' && (copyrightTitle.en !== undefined || copyrightTitle.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        footer.copyrightTitle = { ...(footer.copyrightTitle || {}), ...copyrightTitle };
      } else if (typeof copyrightTitle === 'string') {
        // Old format: single string value - update for specified language
        footer.copyrightTitle = { ...(footer.copyrightTitle || {}), [lang]: copyrightTitle };
      }
    }
    
    if (description !== undefined) {
      if (typeof description === 'object' && (description.en !== undefined || description.es !== undefined)) {
        footer.description = { ...(footer.description || {}), ...description };
      } else if (typeof description === 'string') {
        footer.description = { ...(footer.description || {}), [lang]: description };
      }
    }
    
    if (address !== undefined) {
      if (typeof address === 'object' && (address.en !== undefined || address.es !== undefined)) {
        footer.address = { ...(footer.address || {}), ...address };
      } else if (typeof address === 'string') {
        footer.address = { ...(footer.address || {}), [lang]: address };
      }
    }
    
    if (additionalInfo !== undefined) {
      if (typeof additionalInfo === 'object' && (additionalInfo.en !== undefined || additionalInfo.es !== undefined)) {
        footer.additionalInfo = { ...(footer.additionalInfo || {}), ...additionalInfo };
      } else if (typeof additionalInfo === 'string') {
        footer.additionalInfo = { ...(footer.additionalInfo || {}), [lang]: additionalInfo };
      }
    }
    
    // Handle nested arrays with language support
    if (links !== undefined && Array.isArray(links)) {
      footer.links = links.map(link => {
        const newLink = { ...link };
        if (link.title) {
          if (typeof link.title === 'object' && (link.title.en !== undefined || link.title.es !== undefined)) {
            // New format: nested object
            newLink.title = { ...(newLink.title || {}), ...link.title };
          } else if (typeof link.title === 'string') {
            // Old format: single string
            newLink.title = { ...(newLink.title || {}), [lang]: link.title };
          }
        }
        return newLink;
      });
    }
    
    if (quickLinks !== undefined && Array.isArray(quickLinks)) {
      footer.quickLinks = quickLinks.map(link => {
        const newLink = { ...link };
        if (link.title) {
          if (typeof link.title === 'object' && (link.title.en !== undefined || link.title.es !== undefined)) {
            // New format: nested object
            newLink.title = { ...(newLink.title || {}), ...link.title };
          } else if (typeof link.title === 'string') {
            // Old format: single string
            newLink.title = { ...(newLink.title || {}), [lang]: link.title };
          }
        }
        return newLink;
      });
    }
    
    if (phone !== undefined) footer.phone = phone;
    if (email !== undefined) footer.email = email;
    if (socialMedia !== undefined) footer.socialMedia = socialMedia;

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

