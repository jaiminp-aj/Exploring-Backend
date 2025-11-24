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

    const { lang = 'en' } = req.body;
    
    // Prepare data with language support
    const footerData = prepareForSave({
      copyrightTitle,
      description,
      address,
      phone,
      email,
      links: links || [],
      socialMedia: socialMedia || [],
      quickLinks: quickLinks || [],
      additionalInfo,
    }, lang);

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
    
    // Handle language-specific updates for translatable fields
    if (copyrightTitle !== undefined) {
      if (typeof copyrightTitle === 'string') {
        footer.copyrightTitle = { ...(footer.copyrightTitle || {}), [lang]: copyrightTitle };
      } else if (typeof copyrightTitle === 'object') {
        footer.copyrightTitle = { ...(footer.copyrightTitle || {}), ...copyrightTitle };
      }
    }
    
    if (description !== undefined) {
      if (typeof description === 'string') {
        footer.description = { ...(footer.description || {}), [lang]: description };
      } else if (typeof description === 'object') {
        footer.description = { ...(footer.description || {}), ...description };
      }
    }
    
    if (address !== undefined) {
      if (typeof address === 'string') {
        footer.address = { ...(footer.address || {}), [lang]: address };
      } else if (typeof address === 'object') {
        footer.address = { ...(footer.address || {}), ...address };
      }
    }
    
    if (additionalInfo !== undefined) {
      if (typeof additionalInfo === 'string') {
        footer.additionalInfo = { ...(footer.additionalInfo || {}), [lang]: additionalInfo };
      } else if (typeof additionalInfo === 'object') {
        footer.additionalInfo = { ...(footer.additionalInfo || {}), ...additionalInfo };
      }
    }
    
    // Handle nested arrays with language support
    if (links !== undefined && Array.isArray(links)) {
      footer.links = links.map(link => {
        const newLink = { ...link };
        if (link.title) {
          if (typeof link.title === 'string') {
            newLink.title = { ...(newLink.title || {}), [lang]: link.title };
          } else if (typeof link.title === 'object') {
            newLink.title = { ...(newLink.title || {}), ...link.title };
          }
        }
        return newLink;
      });
    }
    
    if (quickLinks !== undefined && Array.isArray(quickLinks)) {
      footer.quickLinks = quickLinks.map(link => {
        const newLink = { ...link };
        if (link.title) {
          if (typeof link.title === 'string') {
            newLink.title = { ...(newLink.title || {}), [lang]: link.title };
          } else if (typeof link.title === 'object') {
            newLink.title = { ...(newLink.title || {}), ...link.title };
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

