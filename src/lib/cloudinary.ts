import { v2 as cloudinary } from 'cloudinary';

// Debug environment variables (remove in production)
if (process.env.NODE_ENV === 'development') {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ⚙️ [CLOUDINARY] Config:`, {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.substring(0, 4)}...` : 'undefined',
    api_secret: process.env.CLOUDINARY_API_SECRET ? `${process.env.CLOUDINARY_API_SECRET.substring(0, 4)}...` : 'undefined',
  });
}

// Validate required environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing required Cloudinary environment variables');
}

// Configure Cloudinary with explicit string conversion
cloudinary.config({
  cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME).trim(),
  api_key: String(process.env.CLOUDINARY_API_KEY).trim(),
  api_secret: String(process.env.CLOUDINARY_API_SECRET).trim(),
  secure: true,
});

export { cloudinary };