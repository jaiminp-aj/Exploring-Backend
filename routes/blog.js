const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');

// Create Blog Post (Protected route)
router.post('/add', auth, async (req, res) => {
  try {
    const {
      contentType,
      title,
      excerpt,
      slug,
      featuredImageUrl,
      content,
      published,
      author,
      tags,
    } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Blog title is required',
      });
    }

    // Check if slug already exists (if provided)
    if (slug) {
      const existingBlog = await Blog.findOne({ slug });
      if (existingBlog) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists. Please use a different slug.',
        });
      }
    }

    // Create new blog post
    const blog = new Blog({
      contentType: contentType || 'Blog Post',
      title,
      excerpt,
      slug,
      featuredImageUrl,
      content,
      published: published !== undefined ? published : false,
      author,
      tags: tags || [],
    });

    await blog.save();

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: blog,
    });
  } catch (error) {
    console.error('Blog creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists. Please use a different slug.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get All Blog Posts
router.get('/', async (req, res) => {
  try {
    const { 
      publishedOnly, 
      contentType, 
      author,
      tag,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = {};
    
    if (publishedOnly === 'true') {
      query.published = true;
    }
    
    if (contentType) {
      query.contentType = contentType;
    }
    
    if (author) {
      query.author = author;
    }
    
    if (tag) {
      query.tags = tag;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Blog.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content'); // Exclude full content from list view

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: blogs,
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get Single Blog Post by ID or Slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a valid MongoDB ObjectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    let blog;
    if (isObjectId) {
      blog = await Blog.findById(identifier);
    } else {
      blog = await Blog.findOne({ slug: identifier });
    }
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Get blog error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog post ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update Blog Post (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    const {
      contentType,
      title,
      excerpt,
      slug,
      featuredImageUrl,
      content,
      published,
      author,
      tags,
    } = req.body;

    // Check if slug is being updated and if it already exists
    if (slug && slug !== blog.slug) {
      const existingBlog = await Blog.findOne({ slug });
      if (existingBlog) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists. Please use a different slug.',
        });
      }
    }

    if (contentType !== undefined) blog.contentType = contentType;
    if (title !== undefined) blog.title = title;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (slug !== undefined) blog.slug = slug;
    if (featuredImageUrl !== undefined) blog.featuredImageUrl = featuredImageUrl;
    if (content !== undefined) blog.content = content;
    if (published !== undefined) blog.published = published;
    if (author !== undefined) blog.author = author;
    if (tags !== undefined) blog.tags = tags;

    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: blog,
    });
  } catch (error) {
    console.error('Blog update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists. Please use a different slug.',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog post ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete Blog Post (Protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
      data: blog,
    });
  } catch (error) {
    console.error('Blog deletion error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog post ID',
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

