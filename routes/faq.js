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
      content,
      published,
      order,
      lang = 'en', // For backward compatibility
    } = req.body;

    // Validation - check if content array exists and has at least one item
    if (!content || !Array.isArray(content) || content.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'FAQ must have at least one content item',
      });
    }

    // Validate that each content item has at least a title and description in one language
    const validContent = content.filter((item) => {
      const hasTitle = item.title && (
        typeof item.title === 'string' || 
        (typeof item.title === 'object' && (item.title.en || item.title.es))
      );
      const hasDescription = item.description && (
        typeof item.description === 'string' || 
        (typeof item.description === 'object' && (item.description.en || item.description.es))
      );
      return hasTitle && hasDescription;
    });

    if (validContent.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Each FAQ item must have both title and description in at least one language',
      });
    }

    // Prepare data with language support - ensure proper format
    const faqData = {
      content: validContent.map((item) => {
        // Ensure title is in correct format - only include languages with content
        let titleObj = {};
        if (typeof item.title === 'object' && item.title !== null) {
          if (item.title.en && item.title.en.trim()) {
            titleObj.en = item.title.en.trim();
          }
          if (item.title.es && item.title.es.trim()) {
            titleObj.es = item.title.es.trim();
          }
        } else if (typeof item.title === 'string' && item.title.trim()) {
          titleObj[lang] = item.title.trim();
        }

        // Ensure description is in correct format - only include languages with content
        let descriptionObj = {};
        if (typeof item.description === 'object' && item.description !== null) {
          if (item.description.en && item.description.en.trim()) {
            descriptionObj.en = item.description.en.trim();
          }
          if (item.description.es && item.description.es.trim()) {
            descriptionObj.es = item.description.es.trim();
          }
        } else if (typeof item.description === 'string' && item.description.trim()) {
          descriptionObj[lang] = item.description.trim();
        }

        return {
          title: titleObj,
          description: descriptionObj,
        };
      }),
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
      content,
      published,
      order,
    } = req.body;

    // Validate content if provided
    if (content !== undefined) {
      if (!Array.isArray(content) || content.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'FAQ must have at least one content item',
        });
      }

      // Validate that each content item has at least a title and description in one language
      const validContent = content.filter((item) => {
        const hasTitle = item.title && (
          typeof item.title === 'string' || 
          (typeof item.title === 'object' && (item.title.en || item.title.es))
        );
        const hasDescription = item.description && (
          typeof item.description === 'string' || 
          (typeof item.description === 'object' && (item.description.en || item.description.es))
        );
        return hasTitle && hasDescription;
      });

      if (validContent.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Each FAQ item must have both title and description in at least one language',
        });
      }

      // Transform content to ensure proper format
      faq.content = validContent.map(item => {
        const newItem = {};
        if (item.title) {
          if (typeof item.title === 'object' && (item.title.en !== undefined || item.title.es !== undefined)) {
            newItem.title = item.title;
          } else if (typeof item.title === 'string') {
            newItem.title = { [lang]: item.title };
          }
        }
        if (item.description) {
          if (typeof item.description === 'object' && (item.description.en !== undefined || item.description.es !== undefined)) {
            newItem.description = item.description;
          } else if (typeof item.description === 'string') {
            newItem.description = { [lang]: item.description };
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

