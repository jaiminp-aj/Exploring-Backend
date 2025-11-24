const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const auth = require('../middleware/auth');
const getLanguage = require('../middleware/language');
const { transformByLanguage, transformArrayByLanguage, prepareForSave, mergeTranslations } = require('../utils/languageHelper');

// Create Menu Item (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      menuTitle,
      linkUrl,
      visibleOnSite,
      openInNewTab,
      order,
      lang = 'en', // Language for this creation
    } = req.body;

    // Validation
    if (!menuTitle) {
      return res.status(400).json({
        success: false,
        message: 'Menu title is required',
      });
    }

    if (!linkUrl) {
      return res.status(400).json({
        success: false,
        message: 'Link URL is required',
      });
    }

    // Prepare data with language support (linkUrl is NOT translatable)
    const menuData = prepareForSave({
      menuTitle,
      visibleOnSite: visibleOnSite !== undefined ? visibleOnSite : true,
      openInNewTab: openInNewTab !== undefined ? openInNewTab : false,
      order: order !== undefined ? order : 0,
    }, lang);
    
    // Add linkUrl separately (not translatable - same for all languages)
    menuData.linkUrl = linkUrl;

    // Create new menu item
    const menuItem = new Menu(menuData);

    await menuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem,
    });
  } catch (error) {
    console.error('Menu creation error:', error);
    
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

// Get All Menu Items
router.get('/', getLanguage, async (req, res) => {
  try {
    const { visibleOnly } = req.query;
    const language = req.language;
    
    let query = {};
    if (visibleOnly === 'true') {
      query.visibleOnSite = true;
    }

    const menuItems = await Menu.find(query).sort({ order: 1, createdAt: 1 });

    // Transform data based on requested language
    const transformed = transformArrayByLanguage(menuItems, language);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: transformed,
      language,
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get Single Menu Item by ID
router.get('/:id', getLanguage, async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    const language = req.language;
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Transform data based on requested language
    const transformed = transformByLanguage(menuItem, language);

    res.status(200).json({
      success: true,
      data: transformed,
      language,
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update Menu Item (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    const { lang = 'en' } = req.body; // Language for this update
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    const {
      menuTitle,
      linkUrl,
      visibleOnSite,
      openInNewTab,
      order,
    } = req.body;

    // Handle language-specific updates
    if (menuTitle !== undefined) {
      if (typeof menuTitle === 'string') {
        // Single string value - update for specified language
        menuItem.menuTitle = {
          ...(menuItem.menuTitle || {}),
          [lang]: menuTitle
        };
      } else if (typeof menuTitle === 'object') {
        // Already in nested format - merge it
        menuItem.menuTitle = {
          ...(menuItem.menuTitle || {}),
          ...menuTitle
        };
      }
    }
    
    if (linkUrl !== undefined) menuItem.linkUrl = linkUrl;
    if (visibleOnSite !== undefined) menuItem.visibleOnSite = visibleOnSite;
    if (openInNewTab !== undefined) menuItem.openInNewTab = openInNewTab;
    if (order !== undefined) menuItem.order = order;

    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem,
    });
  } catch (error) {
    console.error('Menu update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete Menu Item (Protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const menuItem = await Menu.findByIdAndDelete(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: menuItem,
    });
  } catch (error) {
    console.error('Menu deletion error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID',
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

