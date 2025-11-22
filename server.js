require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('⚠️  Server will start but database operations will fail until MongoDB is running.');
    console.log('💡 To start MongoDB: brew services start mongodb-community');
    console.log('💡 Or use MongoDB Atlas (cloud) and update MONGO_URI in .env');
  }
};

connectDB();

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/footer', require('./routes/footer'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/banner', require('./routes/banner'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/media', require('./routes/media'));
app.use('/api/settings', require('./routes/settings'));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

