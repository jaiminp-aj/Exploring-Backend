require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Sample users to insert
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
  },
  {
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123',
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  },
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not set in .env file');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}\n`);

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users\n');

    // Insert users
    console.log('📝 Inserting users...\n');
    const insertedUsers = [];

    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⚠️  User with email ${userData.email} already exists. Skipping...`);
          continue;
        }

        // Create new user (password will be hashed automatically by pre-save hook)
        const user = new User(userData);
        await user.save();
        insertedUsers.push(user);
        console.log(`✅ Created user: ${user.name} (${user.email})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  User with email ${userData.email} already exists. Skipping...`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }

    console.log(`\n✨ Seed completed! ${insertedUsers.length} user(s) inserted.`);
    console.log('\n📋 User credentials:');
    users.forEach((user) => {
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log('');
    });

    // Close connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedUsers();

