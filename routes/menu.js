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
      parentMenuId,
      parentId, // Support both parentMenuId and parentId for backward compatibility
      lang = 'en', // For backward compatibility
    } = req.body;

    // Validation - check if menuTitle exists (either as string or nested object)
    const hasMenuTitle = menuTitle && (
      typeof menuTitle === 'string' || 
      (typeof menuTitle === 'object' && (menuTitle.en || menuTitle.es))
    );
    
    if (!hasMenuTitle) {
      return res.status(400).json({
        success: false,
        message: 'Menu title is required in at least one language',
      });
    }

    if (!linkUrl) {
      return res.status(400).json({
        success: false,
        message: 'Link URL is required',
      });
    }

    // Handle parentMenuId (support both parentMenuId and parentId)
    const finalParentMenuId = parentMenuId || parentId || null;
    
    // Validate parentMenuId if provided
    if (finalParentMenuId) {
      const parentExists = await Menu.findById(finalParentMenuId);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Parent menu item not found',
        });
      }
    }

    // Prepare data with language support (linkUrl is NOT translatable)
    // prepareForSave handles both nested objects and flat strings
    const menuData = prepareForSave({
      menuTitle,
      visibleOnSite: visibleOnSite !== undefined ? visibleOnSite : true,
      openInNewTab: openInNewTab !== undefined ? openInNewTab : false,
      order: order !== undefined ? order : 0,
    }, lang);
    
    // Add linkUrl separately (not translatable - same for all languages)
    menuData.linkUrl = linkUrl;
    
    // Add parentMenuId if provided
    if (finalParentMenuId) {
      menuData.parentMenuId = finalParentMenuId;
    }

    // Ensure menuTitle is a plain object (not a Mongoose document or special object)
    if (menuData.menuTitle && typeof menuData.menuTitle === 'object') {
      menuData.menuTitle = JSON.parse(JSON.stringify(menuData.menuTitle));
    }

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
    const { visibleOnly, allLanguages, nested } = req.query;
    const language = req.language;
    
    let query = {};
    if (visibleOnly === 'true') {
      query.visibleOnSite = true;
    }

    let menuItems;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript objects without Mongoose transformations
      // This ensures nested language objects are preserved exactly as stored
      menuItems = await Menu.find(query).lean().sort({ order: 1, createdAt: 1 });
      transformed = menuItems;
    } else {
      menuItems = await Menu.find(query).sort({ order: 1, createdAt: 1 });
      transformed = transformArrayByLanguage(menuItems, language);
    }

    // If nested=true, organize menu items hierarchically
    if (nested === 'true') {
      const menuMap = new Map();
      const rootItems = [];

      // First pass: create map of all items
      transformed.forEach(item => {
        const itemId = item._id?.toString() || item.id?.toString();
        menuMap.set(itemId, {
          ...item,
          children: [],
        });
      });

      // Second pass: build hierarchy
      transformed.forEach(item => {
        const itemId = item._id?.toString() || item.id?.toString();
        const parentId = item.parentMenuId?.toString() || item.parentId?.toString();
        
        if (parentId && menuMap.has(parentId)) {
          // Add to parent's children
          menuMap.get(parentId).children.push(menuMap.get(itemId));
        } else {
          // Root level item
          rootItems.push(menuMap.get(itemId));
        }
      });

      // Sort children recursively
      const sortRecursive = (items) => {
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            sortRecursive(item.children);
          }
        });
      };
      sortRecursive(rootItems);

      transformed = rootItems;
    } else {
      // Include parentMenuId in flat structure for backward compatibility
      transformed = transformed.map(item => ({
        ...item,
        parentMenuId: item.parentMenuId || item.parentId || null,
      }));
    }

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
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

// Update Menu Order (Bulk update) - Protected route
// This must come before /:id route to avoid matching "order" as an ID
router.put('/order/update', auth, async (req, res) => {
  try {
    const { menuOrders } = req.body; // Array of { id, order }
    
    if (!Array.isArray(menuOrders) || menuOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'menuOrders must be a non-empty array',
      });
    }

    // Update all menu items in parallel
    const updatePromises = menuOrders.map(({ id, order }) => {
      if (!id || order === undefined) {
        return Promise.resolve(null);
      }
      return Menu.findByIdAndUpdate(
        id,
        { order: parseInt(order, 10) },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Menu order updated successfully',
    });
  } catch (error) {
    console.error('Update menu order error:', error);
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
    const { allLanguages } = req.query;
    const language = req.language;
    
    let menuItem;
    let transformed;
    
    if (allLanguages === 'true') {
      // Use lean() to get plain JavaScript object without Mongoose transformations
      menuItem = await Menu.findById(req.params.id).lean();
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found',
        });
      }
      transformed = menuItem; // Already a plain object from lean()
    } else {
      menuItem = await Menu.findById(req.params.id);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found',
        });
      }
      transformed = transformByLanguage(menuItem, language);
    }

    res.status(200).json({
      success: true,
      data: transformed,
      language: allLanguages === 'true' ? 'all' : language,
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
      parentMenuId,
      parentId, // Support both parentMenuId and parentId for backward compatibility
    } = req.body;

    // Handle language-specific updates
    if (menuTitle !== undefined) {
      if (typeof menuTitle === 'object' && (menuTitle.en !== undefined || menuTitle.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        menuItem.menuTitle = {
          ...(menuItem.menuTitle || {}),
          ...menuTitle
        };
      } else if (typeof menuTitle === 'string') {
        // Old format: single string value - update for specified language
        menuItem.menuTitle = {
          ...(menuItem.menuTitle || {}),
          [lang]: menuTitle
        };
      }
    }
    
    // Handle parentMenuId update
    const finalParentMenuId = parentMenuId !== undefined ? parentMenuId : (parentId !== undefined ? parentId : undefined);
    
    if (finalParentMenuId !== undefined) {
      // If setting to null/empty, remove parent
      if (!finalParentMenuId || finalParentMenuId === '') {
        menuItem.parentMenuId = null;
      } else {
        // Validate parent exists
        const parentExists = await Menu.findById(finalParentMenuId);
        if (!parentExists) {
          return res.status(400).json({
            success: false,
            message: 'Parent menu item not found',
          });
        }
        // Prevent circular reference
        if (finalParentMenuId.toString() === req.params.id) {
          return res.status(400).json({
            success: false,
            message: 'A menu item cannot be its own parent',
          });
        }
        menuItem.parentMenuId = finalParentMenuId;
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

