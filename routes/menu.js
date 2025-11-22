const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const auth = require('../middleware/auth');

// Create Menu Item (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      menuTitle,
      linkUrl,
      visibleOnSite,
      openInNewTab,
      order,
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

    // Create new menu item
    const menuItem = new Menu({
      menuTitle,
      linkUrl,
      visibleOnSite: visibleOnSite !== undefined ? visibleOnSite : true,
      openInNewTab: openInNewTab !== undefined ? openInNewTab : false,
      order: order !== undefined ? order : 0,
    });

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
router.get('/', async (req, res) => {
  try {
    const { visibleOnly } = req.query;
    
    let query = {};
    if (visibleOnly === 'true') {
      query.visibleOnSite = true;
    }

    const menuItems = await Menu.find(query).sort({ order: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems,
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
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem,
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

    if (menuTitle !== undefined) menuItem.menuTitle = menuTitle;
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

