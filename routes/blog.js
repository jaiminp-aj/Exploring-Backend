const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const getLanguage = require('../middleware/language');
const { transformByLanguage, transformArrayByLanguage, prepareForSave } = require('../utils/languageHelper');

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

    // Validation - check if title exists (either as string or nested object)
    const hasTitle = title && (
      typeof title === 'string' || 
      (typeof title === 'object' && (title.en || title.es))
    );
    
    if (!hasTitle) {
      return res.status(400).json({
        success: false,
        message: 'Blog title is required in at least one language',
      });
    }

    const { lang = 'en' } = req.body; // For backward compatibility
    
    // Check if slug already exists (if provided) - check both languages
    if (slug) {
      const slugToCheck = typeof slug === 'object' && (slug.en || slug.es) 
        ? slug 
        : { [lang]: slug };
      const slugQuery = {};
      if (slugToCheck.en) slugQuery['slug.en'] = slugToCheck.en;
      if (slugToCheck.es) slugQuery['slug.es'] = slugToCheck.es;
      
      if (Object.keys(slugQuery).length > 0) {
        const existingBlog = await Blog.findOne({ 
          _id: { $ne: req.body._id }, // Exclude current blog if updating
          $or: Object.entries(slugQuery).map(([k, v]) => ({ [k]: v })) 
        });
        if (existingBlog) {
          return res.status(400).json({
            success: false,
            message: 'Slug already exists. Please use a different slug.',
          });
        }
      }
    }

    // Prepare data with language support
    // prepareForSave handles both nested objects and flat strings
    const blogData = prepareForSave({
      contentType: contentType || 'Blog Post',
      title,
      excerpt,
      slug,
      featuredImageUrl,
      content,
      published: published !== undefined ? published : false,
      author,
      tags: tags || [],
    }, lang);

    // Create new blog post
    const blog = new Blog(blogData);

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
router.get('/', getLanguage, async (req, res) => {
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
    const language = req.language;
    
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
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(query);

    // Transform data based on requested language
    const transformed = transformArrayByLanguage(blogs, language).map(blog => {
      // Exclude full content from list view for performance
      const { content, ...rest } = blog;
      return rest;
    });

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transformed,
      language,
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
router.get('/:identifier', getLanguage, async (req, res) => {
  try {
    const { identifier } = req.params;
    const language = req.language;
    
    // Check if identifier is a valid MongoDB ObjectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    let blog;
    if (isObjectId) {
      blog = await Blog.findById(identifier);
    } else {
      // Try to find by slug in either language
      blog = await Blog.findOne({
        $or: [
          { 'slug.en': identifier },
          { 'slug.es': identifier }
        ]
      });
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

    // Transform data based on requested language
    const transformed = transformByLanguage(blog, language);

    res.status(200).json({
      success: true,
      data: transformed,
      language,
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
    const { lang = 'en' } = req.body;
    
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

    // Check if slug is being updated and if it already exists (for language-specific slugs)
    if (slug) {
      const slugToCheck = typeof slug === 'string' ? { [lang]: slug } : slug;
      const slugQuery = {};
      if (slugToCheck.en) slugQuery['slug.en'] = slugToCheck.en;
      if (slugToCheck.es) slugQuery['slug.es'] = slugToCheck.es;
      
      if (Object.keys(slugQuery).length > 0) {
        const existingBlog = await Blog.findOne({
          _id: { $ne: blog._id },
          $or: Object.entries(slugQuery).map(([k, v]) => ({ [k]: v }))
        });
        if (existingBlog) {
          return res.status(400).json({
            success: false,
            message: 'Slug already exists. Please use a different slug.',
          });
        }
      }
    }

    if (contentType !== undefined) blog.contentType = contentType;
    
    // Handle language-specific updates for translatable fields
    if (title !== undefined) {
      if (typeof title === 'object' && (title.en !== undefined || title.es !== undefined)) {
        // New format: nested object with en/es keys - merge it
        blog.title = { ...(blog.title || {}), ...title };
      } else if (typeof title === 'string') {
        // Old format: single string value - update for specified language
        blog.title = { ...(blog.title || {}), [lang]: title };
      }
    }
    
    if (excerpt !== undefined) {
      if (typeof excerpt === 'object' && (excerpt.en !== undefined || excerpt.es !== undefined)) {
        blog.excerpt = { ...(blog.excerpt || {}), ...excerpt };
      } else if (typeof excerpt === 'string') {
        blog.excerpt = { ...(blog.excerpt || {}), [lang]: excerpt };
      }
    }
    
    if (slug !== undefined) {
      if (typeof slug === 'object' && (slug.en !== undefined || slug.es !== undefined)) {
        blog.slug = { ...(blog.slug || {}), ...slug };
      } else if (typeof slug === 'string') {
        blog.slug = { ...(blog.slug || {}), [lang]: slug };
      }
    }
    
    if (content !== undefined) {
      if (typeof content === 'object' && (content.en !== undefined || content.es !== undefined)) {
        blog.content = { ...(blog.content || {}), ...content };
      } else if (typeof content === 'string') {
        blog.content = { ...(blog.content || {}), [lang]: content };
      }
    }
    
    if (featuredImageUrl !== undefined) blog.featuredImageUrl = featuredImageUrl;
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

