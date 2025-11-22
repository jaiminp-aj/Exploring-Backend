const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register/Login API
router.post('/login', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist and name is provided, create new user
      if (name) {
        user = new User({
          name,
          email,
          password,
        });
        await user.save();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials or user not found. Please provide name to register.',
        });
      }
    } else {
      // User exists, verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: user.name ? 'Login successful' : 'User created and logged in',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
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

module.exports = router;

