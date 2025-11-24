# MongoDB Setup Guide

## Current Status
Your `.env` file is configured to use local MongoDB:
```
MONGO_URI=mongodb://localhost:27017/exploring-api
```

## Option 1: Start Local MongoDB (Recommended for Development)

### macOS (Homebrew)
```bash
# Start MongoDB service
brew services start mongodb-community

# Or start manually
mongod --config /opt/homebrew/etc/mongod.conf

# Check if MongoDB is running
brew services list | grep mongodb
```

### Troubleshooting MongoDB Service Issues
If you get service errors, try:
```bash
# Stop the service first
brew services stop mongodb-community

# Remove the plist file
rm ~/Library/LaunchAgents/homebrew.mxcl.mongodb-community.plist

# Start again
brew services start mongodb-community
```

### Verify MongoDB is Running
```bash
# Check if MongoDB is listening on port 27017
lsof -i :27017

# Or try connecting
mongosh
```

## Option 2: Use MongoDB Atlas (Cloud - Recommended for Production)

1. **Create a free account** at https://www.mongodb.com/cloud/atlas

2. **Create a new cluster** (free tier available)

3. **Get your connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

4. **Update your `.env` file:**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/exploring-api?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your MongoDB Atlas credentials.

5. **Whitelist your IP address** in MongoDB Atlas:
   - Go to Network Access
   - Add your current IP address (or 0.0.0.0/0 for development)

## Option 3: Use Docker (Alternative)

If you have Docker installed:
```bash
# Run MongoDB in a container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=exploring-api \
  mongo:latest

# Check if it's running
docker ps | grep mongodb
```

## Verify Connection

Once MongoDB is running, restart your backend server:
```bash
cd Exploring-Backend
npm run dev
```

You should see:
```
✅ MongoDB Connected successfully
📊 Database: exploring-api
```

## Common Issues

### Connection Refused Error
- **Cause**: MongoDB is not running
- **Solution**: Start MongoDB using one of the options above

### Authentication Failed
- **Cause**: Wrong credentials in MONGO_URI
- **Solution**: Check your `.env` file and verify credentials

### Timeout Error
- **Cause**: Network issues or MongoDB not accessible
- **Solution**: 
  - Check firewall settings
  - Verify MongoDB is running
  - For Atlas, check IP whitelist

## Need Help?

- MongoDB Documentation: https://docs.mongodb.com/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Homebrew MongoDB: https://formulae.brew.sh/formula/mongodb-community

