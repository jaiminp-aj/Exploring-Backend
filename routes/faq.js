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
      title,
      description,
      published,
      order,
      lang = 'en', // For backward compatibility
    } = req.body;

    // Validation - check if title and description exist
    const hasTitle = title && (
      typeof title === 'string' || 
      (typeof title === 'object' && (title.en || title.es))
    );
    
    const hasDescription = description && (
      typeof description === 'string' || 
      (typeof description === 'object' && (description.en || description.es))
    );

    if (!hasTitle) {
      return res.status(400).json({
        success: false,
        message: 'FAQ title is required in at least one language',
      });
    }

    if (!hasDescription) {
      return res.status(400).json({
        success: false,
        message: 'FAQ description is required in at least one language',
      });
    }

    // Prepare data with language support - ensure proper format
    let titleObj = {};
    if (typeof title === 'object' && title !== null) {
      if (title.en && title.en.trim()) {
        titleObj.en = title.en.trim();
      }
      if (title.es && title.es.trim()) {
        titleObj.es = title.es.trim();
      }
    } else if (typeof title === 'string' && title.trim()) {
      titleObj[lang] = title.trim();
    }

    // Ensure description is in correct format - only include languages with content
    let descriptionObj = {};
    if (typeof description === 'object' && description !== null) {
      if (description.en && description.en.trim()) {
        descriptionObj.en = description.en.trim();
      }
      if (description.es && description.es.trim()) {
        descriptionObj.es = description.es.trim();
      }
    } else if (typeof description === 'string' && description.trim()) {
      descriptionObj[lang] = description.trim();
    }

    const faqData = {
      title: titleObj,
      description: descriptionObj,
      published: published !== undefined ? published : true,
      order: order !== undefined ? order : 0,
    };

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
    const { publishedOnly, allLanguages } = req.query;
    const language = req.language;
    
    let query = {};
    if (publishedOnly === 'true') {
      query.published = true;
    }

    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });

    // If allLanguages is true, return full nested objects without transformation
    if (allLanguages === 'true') {
      const plainFAQs = faqs.map(faq => faq.toObject ? faq.toObject() : faq);
      return res.status(200).json({
        success: true,
        count: faqs.length,
        data: plainFAQs,
        language: 'all',
      });
    }

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
    const { allLanguages } = req.query;
    const faq = await FAQ.findById(req.params.id);
    const language = req.language;
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    // If allLanguages is true, return full nested objects without transformation
    if (allLanguages === 'true') {
      const plainFAQ = faq.toObject ? faq.toObject() : faq;
      return res.status(200).json({
        success: true,
        data: plainFAQ,
        language: 'all',
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
      title,
      description,
      published,
      order,
    } = req.body;

    // Handle title update
    if (title !== undefined) {
      if (typeof title === 'object' && (title.en !== undefined || title.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        faq.title = {
          ...(faq.title || {}),
          ...title
        };
      } else if (typeof title === 'string') {
        // Old format: single string value - update for specified language
        faq.title = {
          ...(faq.title || {}),
          [lang]: title
        };
      }
    }

    // Handle description update
    if (description !== undefined) {
      if (typeof description === 'object' && (description.en !== undefined || description.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        faq.description = {
          ...(faq.description || {}),
          ...description
        };
      } else if (typeof description === 'string') {
        // Old format: single string value - update for specified language
        faq.description = {
          ...(faq.description || {}),
          [lang]: description
        };
      }
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

// Update FAQ Order (Bulk update) - Protected route
router.put('/order/update', auth, async (req, res) => {
  try {
    const { faqOrders } = req.body; // Array of { id, order }
    
    if (!Array.isArray(faqOrders) || faqOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'faqOrders must be a non-empty array',
      });
    }

    // Update all FAQ items in parallel
    const updatePromises = faqOrders.map(({ id, order }) => {
      if (!id || order === undefined) {
        return Promise.resolve(null);
      }
      return FAQ.findByIdAndUpdate(
        id,
        { order: parseInt(order, 10) },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'FAQ order updated successfully',
    });
  } catch (error) {
    console.error('Update FAQ order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;

