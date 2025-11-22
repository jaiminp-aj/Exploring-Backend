const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const auth = require('../middleware/auth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// Helper function to determine file type
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  return 'other';
};

// Helper function to determine Cloudinary resource type
const getCloudinaryResourceType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw'; // For documents and other files
};

// Upload Media (Protected route)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const {
      description,
      altText,
      tags,
    } = req.body;

    const fileType = getFileType(req.file.mimetype);
    const resourceType = getCloudinaryResourceType(req.file.mimetype);
    const folder = `media/${fileType}s`;

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      folder,
      resourceType
    );

    // Create new media record
    const media = new Media({
      filename: cloudinaryResult.public_id.split('/').pop(),
      originalName: req.file.originalname,
      fileType: fileType,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      description: description || '',
      altText: altText || '',
      uploadedBy: req.user.userId,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      isActive: true,
    });

    await media.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully to Cloudinary',
      data: media,
    });
  } catch (error) {
    console.error('Media upload error:', error);

    if (error.message.includes('not allowed')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

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

// Upload Multiple Media Files (Protected route)
router.post('/upload-multiple', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const uploadedMedia = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const fileType = getFileType(file.mimetype);
        const resourceType = getCloudinaryResourceType(file.mimetype);
        const folder = `media/${fileType}s`;

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
          file.buffer,
          folder,
          resourceType
        );

        const media = new Media({
          filename: cloudinaryResult.public_id.split('/').pop(),
          originalName: file.originalname,
          fileType: fileType,
          mimeType: file.mimetype,
          fileSize: file.size,
          fileUrl: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
          description: '',
          altText: '',
          uploadedBy: req.user.userId,
          tags: [],
          isActive: true,
        });

        await media.save();
        uploadedMedia.push(media);
      } catch (fileError) {
        console.error(`Error uploading file ${file.originalname}:`, fileError);
        errors.push({
          filename: file.originalname,
          error: fileError.message,
        });
      }
    }

    if (uploadedMedia.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload any files',
        errors: errors,
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedMedia.length} file(s) uploaded successfully to Cloudinary`,
      count: uploadedMedia.length,
      data: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Multiple media upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get All Media Files
router.get('/', async (req, res) => {
  try {
    const {
      fileType,
      uploadedBy,
      tag,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let query = {};

    if (fileType) {
      query.fileType = fileType;
    }

    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    if (tag) {
      query.tags = tag;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const mediaFiles = await Media.find(query)
      .populate('uploadedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Media.countDocuments(query);

    res.status(200).json({
      success: true,
      count: mediaFiles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: mediaFiles,
    });
  } catch (error) {
    console.error('Get media files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get Single Media File by ID
router.get('/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found',
      });
    }

    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error('Get media file error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid media file ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update Media Metadata (Protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found',
      });
    }

    const {
      description,
      altText,
      tags,
      isActive,
    } = req.body;

    if (description !== undefined) media.description = description;
    if (altText !== undefined) media.altText = altText;
    if (tags !== undefined) {
      media.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }
    if (isActive !== undefined) media.isActive = isActive;

    await media.save();

    res.status(200).json({
      success: true,
      message: 'Media file updated successfully',
      data: media,
    });
  } catch (error) {
    console.error('Media update error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid media file ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete Media File (Protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found',
      });
    }

    // Delete from Cloudinary if public_id exists
    if (media.cloudinaryPublicId) {
      try {
        const resourceType = getCloudinaryResourceType(media.mimeType);
        await deleteFromCloudinary(media.cloudinaryPublicId, resourceType);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    } else if (media.filePath) {
      // Fallback: Try to delete local file if it exists (for backward compatibility)
      try {
        const fs = require('fs');
        if (fs.existsSync(media.filePath)) {
          fs.unlinkSync(media.filePath);
        }
      } catch (fileError) {
        console.error('Error deleting local file:', fileError);
      }
    }

    // Delete database record
    await Media.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Media file deleted successfully from Cloudinary',
      data: media,
    });
  } catch (error) {
    console.error('Media deletion error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid media file ID',
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
