const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const auth = require('../middleware/auth');
const getLanguage = require('../middleware/language');
const { transformByLanguage, transformArrayByLanguage, prepareForSave } = require('../utils/languageHelper');

// Create FAQ (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      description,
      content,
      published,
      order,
      lang = 'en', // For backward compatibility
    } = req.body;

    // Validation - check if description exists (either as string or nested object)
    const hasDescription = description && (
      typeof description === 'string' || 
      (typeof description === 'object' && (description.en || description.es))
    );
    
    if (!hasDescription) {
      return res.status(400).json({
        success: false,
        message: 'FAQ description is required in at least one language',
      });
    }

    // Prepare data with language support
    // prepareForSave handles both nested objects and flat strings
    const faqData = prepareForSave({
      description,
      content: content || [],
      published: published !== undefined ? published : true,
      order: order !== undefined ? order : 0,
    }, lang);

    // Create new FAQ
    const faq = new FAQ(faqData);

    await faq.save();

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq,
    });
  } catch (error) {
    console.error('FAQ creation error:', error);
    
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

// Get All FAQs
router.get('/', getLanguage, async (req, res) => {
  try {
    const { publishedOnly } = req.query;
    const language = req.language;
    
    let query = {};
    if (publishedOnly === 'true') {
      query.published = true;
    }

    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });

    // Transform data based on requested language
    const transformed = transformArrayByLanguage(faqs, language);

    res.status(200).json({
      success: true,
      count: faqs.length,
      data: transformed,
      language,
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get Single FAQ by ID
router.get('/:id', getLanguage, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    const language = req.language;
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    // Transform data based on requested language
    const transformed = transformByLanguage(faq, language);

    res.status(200).json({
      success: true,
      data: transformed,
      language,
    });
  } catch (error) {
    console.error('Get FAQ error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update FAQ (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    const { lang = 'en' } = req.body;
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    const {
      description,
      content,
      published,
      order,
    } = req.body;

    // Handle language-specific updates
    if (description !== undefined) {
      if (typeof description === 'object' && (description.en !== undefined || description.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        faq.description = { ...(faq.description || {}), ...description };
      } else if (typeof description === 'string') {
        // Old format: single string value - update for specified language
        faq.description = { ...(faq.description || {}), [lang]: description };
      }
    }
    
    if (content !== undefined && Array.isArray(content)) {
      faq.content = content.map(item => {
        const newItem = { ...item };
        if (item.title) {
          if (typeof item.title === 'object' && (item.title.en !== undefined || item.title.es !== undefined)) {
            // New format: nested object
            newItem.title = { ...(newItem.title || {}), ...item.title };
          } else if (typeof item.title === 'string') {
            // Old format: single string
            newItem.title = { ...(newItem.title || {}), [lang]: item.title };
          }
        }
        if (item.description) {
          if (typeof item.description === 'object' && (item.description.en !== undefined || item.description.es !== undefined)) {
            // New format: nested object
            newItem.description = { ...(newItem.description || {}), ...item.description };
          } else if (typeof item.description === 'string') {
            // Old format: single string
            newItem.description = { ...(newItem.description || {}), [lang]: item.description };
          }
        }
        return newItem;
      });
    }
    
    if (published !== undefined) faq.published = published;
    if (order !== undefined) faq.order = order;

    await faq.save();

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq,
    });
  } catch (error) {
    console.error('FAQ update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete FAQ (Protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
      data: faq,
    });
  } catch (error) {
    console.error('FAQ deletion error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID',
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

