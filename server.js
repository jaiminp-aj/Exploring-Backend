require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB with retry logic
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not set in .env file');
      console.log('💡 Please create a .env file with MONGO_URI (see .env.example)');
      return;
    }

    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('✅ MongoDB Connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\n📝 Troubleshooting steps:');
    console.log('1. For local MongoDB:');
    console.log('   - macOS: brew services start mongodb-community');
    console.log('   - Linux: sudo systemctl start mongod');
    console.log('   - Windows: net start MongoDB');
    console.log('2. For MongoDB Atlas (cloud):');
    console.log('   - Create account at https://www.mongodb.com/cloud/atlas');
    console.log('   - Create a cluster and get connection string');
    console.log('   - Update MONGO_URI in .env file');
    console.log('3. Check if .env file exists and has MONGO_URI set');
    console.log('\n⚠️  Server will start but database operations will fail until MongoDB is connected.');
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
app.use('/api/faq', require('./routes/faq'));
app.use('/api/what-is-quran', require('./routes/what-is-quran'));
app.use('/api/what-is-islam', require('./routes/what-is-islam'));
app.use('/api/basics', require('./routes/basics'));

// Health check route

// app.use(express.static(path.join(__dirname, "dist")));

// app.use(formidable());
// app.get("*", function (req, res) {
//     res.sendFile(path.join(__dirname, "dist/index.html"));
// });

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

