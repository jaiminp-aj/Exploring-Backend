# Exploring API

A Node.js, Express, MongoDB API with JWT Authentication.

## Features

- User authentication with JWT
- Login/Register API
- Footer management API
- Menu management API (CRUD operations)
- Banner management API (CRUD operations)
- Blog management API (CRUD operations)
- Media Manager API (CRUD operations with file upload)
- Site Settings API (CRUD operations)
- MongoDB database integration
- Password hashing with bcryptjs

## Prerequisites

- Node.js (latest version)
- MongoDB (latest version)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/exploring-api
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   
   # Cloudinary Configuration (for media storage)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Setup Cloudinary** (required for media uploads):
   - Sign up for a free account at [Cloudinary](https://cloudinary.com/)
   - Go to your Dashboard and copy your:
     - Cloud Name
     - API Key
     - API Secret
   - Add these values to your `.env` file

5. **Start MongoDB** (required):
   - If MongoDB is installed locally, start it with:
     ```bash
     mongod
     ```
   - Or use MongoDB Atlas (cloud) and update `MONGO_URI` in `.env`

6. Run the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login or register a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### Footer

#### POST `/api/footer/add` (Protected)
Add a new footer configuration.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "copyrightTitle": "© 2025 My Company. All rights reserved.",
  "description": "Footer description",
  "address": "123 Main St, City, Country",
  "phone": "+1234567890",
  "email": "contact@example.com",
  "links": [
    {
      "title": "About Us",
      "url": "/about"
    }
  ],
  "socialMedia": [
    {
      "platform": "Facebook",
      "url": "https://facebook.com/example",
      "icon": "facebook-icon"
    }
  ],
  "quickLinks": [
    {
      "title": "Privacy Policy",
      "url": "/privacy"
    }
  ],
  "additionalInfo": "Additional footer information"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Footer created successfully",
  "data": { ... }
}
```

#### GET `/api/footer`
Get the latest footer configuration.

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

#### PUT `/api/footer/:id` (Protected)
Update footer configuration.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

### Menu

#### POST `/api/menu/add` (Protected)
Create a new menu item.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "menuTitle": "Home",
  "linkUrl": "/home",
  "visibleOnSite": true,
  "openInNewTab": false,
  "order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Menu item created successfully",
  "data": {
    "_id": "menu_id",
    "menuTitle": "Home",
    "linkUrl": "/home",
    "visibleOnSite": true,
    "openInNewTab": false,
    "order": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/menu`
Get all menu items.

**Query Parameters:**
- `visibleOnly` (optional): Set to `true` to get only visible menu items

**Example:**
```
GET /api/menu?visibleOnly=true
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "menu_id",
      "menuTitle": "Home",
      "linkUrl": "/home",
      "visibleOnSite": true,
      "openInNewTab": false,
      "order": 1
    }
  ]
}
```

#### GET `/api/menu/:id`
Get a single menu item by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "menu_id",
    "menuTitle": "Home",
    "linkUrl": "/home",
    "visibleOnSite": true,
    "openInNewTab": false,
    "order": 1
  }
}
```

#### PUT `/api/menu/:id` (Protected)
Update a menu item.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "menuTitle": "About Us",
  "linkUrl": "/about",
  "visibleOnSite": true,
  "openInNewTab": true,
  "order": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Menu item updated successfully",
  "data": { ... }
}
```

#### DELETE `/api/menu/:id` (Protected)
Delete a menu item.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Menu item deleted successfully",
  "data": { ... }
}
```

### Banner

#### POST `/api/banner/add` (Protected)
Create a new banner.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "title": "Welcome to Our Website",
  "subtitle": "Optional subtitle text",
  "backgroundImageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "ctaButtonText": "Learn More",
  "ctaButtonLink": "https://example.com",
  "order": 1,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Banner created successfully",
  "data": {
    "_id": "banner_id",
    "title": "Welcome to Our Website",
    "subtitle": "Optional subtitle text",
    "backgroundImageUrl": "https://example.com/image.jpg",
    "videoUrl": "https://example.com/video.mp4",
    "ctaButtonText": "Learn More",
    "ctaButtonLink": "https://example.com",
    "order": 1,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/banner`
Get all banners.

**Query Parameters:**
- `activeOnly` (optional): Set to `true` to get only active banners

**Example:**
```
GET /api/banner?activeOnly=true
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "banner_id",
      "title": "Welcome to Our Website",
      "subtitle": "Optional subtitle text",
      "backgroundImageUrl": "https://example.com/image.jpg",
      "videoUrl": "https://example.com/video.mp4",
      "ctaButtonText": "Learn More",
      "ctaButtonLink": "https://example.com",
      "order": 1,
      "isActive": true
    }
  ]
}
```

#### GET `/api/banner/:id`
Get a single banner by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "banner_id",
    "title": "Welcome to Our Website",
    "subtitle": "Optional subtitle text",
    "backgroundImageUrl": "https://example.com/image.jpg",
    "videoUrl": "https://example.com/video.mp4",
    "ctaButtonText": "Learn More",
    "ctaButtonLink": "https://example.com",
    "order": 1,
    "isActive": true
  }
}
```

#### PUT `/api/banner/:id` (Protected)
Update a banner.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "title": "Updated Banner Title",
  "subtitle": "Updated subtitle",
  "backgroundImageUrl": "https://example.com/new-image.jpg",
  "videoUrl": "https://example.com/new-video.mp4",
  "ctaButtonText": "Get Started",
  "ctaButtonLink": "https://example.com/new-link",
  "order": 2,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Banner updated successfully",
  "data": { ... }
}
```

#### DELETE `/api/banner/:id` (Protected)
Delete a banner.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Banner deleted successfully",
  "data": { ... }
}
```

### Blog

#### POST `/api/blog/add` (Protected)
Create a new blog post.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "contentType": "Blog Post",
  "title": "My First Blog Post",
  "excerpt": "Brief summary of the post (shown in listings)",
  "slug": "my-first-blog-post",
  "featuredImageUrl": "https://example.com/image.jpg",
  "content": "Write your blog post content here. Use markdown formatting: **bold**, _italic_, ~~strikethrough~~, - lists, ```code```",
  "published": false,
  "author": "John Doe",
  "tags": ["technology", "web development"]
}
```

**Note:** If `slug` is not provided, it will be auto-generated from the title.

**Response:**
```json
{
  "success": true,
  "message": "Blog post created successfully",
  "data": {
    "_id": "blog_id",
    "contentType": "Blog Post",
    "title": "My First Blog Post",
    "excerpt": "Brief summary of the post (shown in listings)",
    "slug": "my-first-blog-post",
    "featuredImageUrl": "https://example.com/image.jpg",
    "content": "Write your blog post content here...",
    "published": false,
    "author": "John Doe",
    "tags": ["technology", "web development"],
    "views": 0,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/blog`
Get all blog posts with pagination and filtering.

**Query Parameters:**
- `publishedOnly` (optional): Set to `true` to get only published posts
- `contentType` (optional): Filter by content type ("Blog Post" or "Video")
- `author` (optional): Filter by author name
- `tag` (optional): Filter by tag
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Field to sort by (default: "createdAt")
- `sortOrder` (optional): Sort order "asc" or "desc" (default: "desc")

**Examples:**
```
GET /api/blog?publishedOnly=true
GET /api/blog?contentType=Video&page=1&limit=5
GET /api/blog?tag=technology&sortBy=views&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 20,
  "page": 1,
  "pages": 2,
  "data": [
    {
      "_id": "blog_id",
      "contentType": "Blog Post",
      "title": "My First Blog Post",
      "excerpt": "Brief summary of the post",
      "slug": "my-first-blog-post",
      "featuredImageUrl": "https://example.com/image.jpg",
      "published": true,
      "author": "John Doe",
      "tags": ["technology"],
      "views": 10,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Note:** The full `content` field is excluded from list view for performance. Use GET by ID/slug to retrieve full content.

#### GET `/api/blog/:identifier`
Get a single blog post by ID or slug.

**Parameters:**
- `identifier`: Can be either a MongoDB ObjectId or a slug

**Examples:**
```
GET /api/blog/507f1f77bcf86cd799439011
GET /api/blog/my-first-blog-post
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "blog_id",
    "contentType": "Blog Post",
    "title": "My First Blog Post",
    "excerpt": "Brief summary of the post",
    "slug": "my-first-blog-post",
    "featuredImageUrl": "https://example.com/image.jpg",
    "content": "Full blog post content with markdown...",
    "published": true,
    "author": "John Doe",
    "tags": ["technology", "web development"],
    "views": 11,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Note:** View count is automatically incremented when a blog post is retrieved.

#### PUT `/api/blog/:id` (Protected)
Update a blog post.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "title": "Updated Blog Post Title",
  "excerpt": "Updated excerpt",
  "slug": "updated-blog-post-slug",
  "featuredImageUrl": "https://example.com/new-image.jpg",
  "content": "Updated content with markdown formatting",
  "published": true,
  "author": "John Doe",
  "tags": ["technology", "updated"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blog post updated successfully",
  "data": { ... }
}
```

#### DELETE `/api/blog/:id` (Protected)
Delete a blog post.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Blog post deleted successfully",
  "data": { ... }
}
```

### Media Manager

#### POST `/api/media/upload` (Protected)
Upload a single media file (image or video).

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file` (required): The file to upload
- `description` (optional): Description of the media
- `altText` (optional): Alt text for images
- `tags` (optional): Comma-separated tags or array

**Supported File Types:**
- Images: JPEG, JPG, PNG, GIF, WebP, SVG
- Videos: MP4, MPEG, QuickTime, AVI, WebM
- Documents: PDF, DOC, DOCX, TXT

**File Size Limit:** 100MB

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "_id": "media_id",
    "filename": "image-1234567890-123456789.jpg",
    "originalName": "my-image.jpg",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 245678,
    "fileUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/media/images/image-1234567890.jpg",
    "cloudinaryPublicId": "media/images/image-1234567890",
    "description": "My image description",
    "altText": "Alternative text",
    "uploadedBy": "user_id",
    "tags": ["photo", "banner"],
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/media/upload-multiple` (Protected)
Upload multiple media files at once (up to 10 files).

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `files` (required): Array of files to upload (max 10)

**Response:**
```json
{
  "success": true,
  "message": "3 file(s) uploaded successfully",
  "count": 3,
  "data": [
    { ... },
    { ... },
    { ... }
  ]
}
```

#### GET `/api/media`
Get all media files with pagination and filtering.

**Query Parameters:**
- `fileType` (optional): Filter by type ("image", "video", "document", "other")
- `uploadedBy` (optional): Filter by uploader user ID
- `tag` (optional): Filter by tag
- `isActive` (optional): Filter by active status (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by (default: "createdAt")
- `sortOrder` (optional): Sort order "asc" or "desc" (default: "desc")

**Examples:**
```
GET /api/media?fileType=image&page=1&limit=10
GET /api/media?tag=banner&isActive=true
GET /api/media?uploadedBy=user_id&sortBy=fileSize&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "media_id",
      "filename": "image-1234567890.jpg",
      "originalName": "my-image.jpg",
      "fileType": "image",
      "mimeType": "image/jpeg",
      "fileSize": 245678,
      "fileUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/media/images/image-1234567890.jpg",
      "description": "My image",
      "altText": "Alternative text",
      "uploadedBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "tags": ["photo"],
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET `/api/media/:id`
Get a single media file by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "media_id",
    "filename": "image-1234567890.jpg",
    "originalName": "my-image.jpg",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 245678,
    "fileUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/media/images/image-1234567890.jpg",
    "cloudinaryPublicId": "media/images/image-1234567890",
    "description": "My image description",
    "altText": "Alternative text",
    "uploadedBy": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "tags": ["photo", "banner"],
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### PUT `/api/media/:id` (Protected)
Update media file metadata (description, altText, tags, isActive).

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "description": "Updated description",
  "altText": "Updated alt text",
  "tags": ["updated", "tags"],
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Media file updated successfully",
  "data": { ... }
}
```

#### DELETE `/api/media/:id` (Protected)
Delete a media file (removes both database record and physical file).

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Media file deleted successfully",
  "data": { ... }
}
```

**Note:** When a media file is deleted, it is automatically removed from Cloudinary. The file URL points to Cloudinary's CDN for fast delivery.

### Site Settings

#### GET `/api/settings`
Get current site settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "settings_id",
    "siteName": "My Website",
    "logoUrl": "https://example.com/logo.png",
    "faviconUrl": "https://example.com/favicon.ico",
    "contactEmail": "contact@example.com",
    "contactPhone": "+1 (555) 123-4567",
    "socialMedia": {
      "facebook": "https://facebook.com/yourprofile",
      "twitter": "https://twitter.com/yourprofile",
      "instagram": "https://instagram.com/yourprofile",
      "linkedin": "https://linkedin.com/yourprofile",
      "youtube": "https://youtube.com/yourprofile"
    },
    "metaDescription": "Website description",
    "metaKeywords": "keywords, seo",
    "address": "123 Main St, City, Country",
    "timezone": "UTC",
    "language": "en",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/settings` (Protected)
Create or update site settings (creates if doesn't exist, updates if exists).

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "siteName": "My Website",
  "logoUrl": "https://example.com/logo.png",
  "faviconUrl": "https://example.com/favicon.ico",
  "contactEmail": "contact@example.com",
  "contactPhone": "+1 (555) 123-4567",
  "socialMedia": {
    "facebook": "https://facebook.com/yourprofile",
    "twitter": "https://twitter.com/yourprofile",
    "instagram": "https://instagram.com/yourprofile",
    "linkedin": "https://linkedin.com/yourprofile",
    "youtube": "https://youtube.com/yourprofile"
  },
  "metaDescription": "Website description",
  "metaKeywords": "keywords, seo",
  "address": "123 Main St, City, Country",
  "timezone": "UTC",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings saved successfully",
  "data": { ... }
}
```

#### PUT `/api/settings` (Protected)
Update site settings (partial update supported).

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "siteName": "Updated Website Name",
  "contactEmail": "newemail@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": { ... }
}
```

#### PUT `/api/settings/general` (Protected)
Update only general settings.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "siteName": "My Website",
  "logoUrl": "https://example.com/logo.png",
  "faviconUrl": "https://example.com/favicon.ico",
  "contactEmail": "contact@example.com",
  "contactPhone": "+1 (555) 123-4567",
  "metaDescription": "Website description",
  "metaKeywords": "keywords, seo",
  "address": "123 Main St, City, Country",
  "timezone": "UTC",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "General settings updated successfully",
  "data": { ... }
}
```

#### PUT `/api/settings/social-media` (Protected)
Update only social media links.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Request Body:**
```json
{
  "socialMedia": {
    "facebook": "https://facebook.com/yourprofile",
    "twitter": "https://twitter.com/yourprofile",
    "instagram": "https://instagram.com/yourprofile",
    "linkedin": "https://linkedin.com/yourprofile",
    "youtube": "https://youtube.com/yourprofile"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Social media links updated successfully",
  "data": { ... }
}
```

#### DELETE `/api/settings` (Protected)
Reset settings to default values.

**Headers:**
```
Authorization: Bearer <token>
or
x-auth-token: <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Settings reset to default successfully",
  "data": { ... }
}
```

**Note:** Only one settings document exists in the database. All operations work on this single document.

## Project Structure

```
exploring-api/
├── models/
│   ├── User.js
│   ├── Footer.js
│   ├── Menu.js
│   ├── Banner.js
│   ├── Blog.js
│   ├── Media.js
│   └── Settings.js
├── routes/
│   ├── auth.js
│   ├── footer.js
│   ├── menu.js
│   ├── banner.js
│   ├── blog.js
│   ├── media.js
│   └── settings.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── uploads/
│   ├── images/
│   ├── videos/
│   ├── documents/
│   └── other/
├── server.js
├── package.json
├── .env.example
└── README.md
```

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT (jsonwebtoken)
- bcryptjs (for password hashing)
- multer (for file uploads)
- cloudinary (for cloud-based media storage)
- dotenv (for environment variables)

## Troubleshooting

### Port Already in Use
If you get `EADDRINUSE` error:
- Port 5000 is often used by macOS AirPlay service
- Change the `PORT` in `.env` to a different port (e.g., 3000, 5001, 8000)
- Or kill the process using the port: `lsof -ti:PORT | xargs kill -9`

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check MongoDB service status
- Verify `MONGO_URI` in `.env` is correct
- For MongoDB Atlas, ensure your IP is whitelisted

### Server Running but API Returns Timeout
- Check if MongoDB is running and accessible
- Verify MongoDB connection string is correct

## License

ISC

