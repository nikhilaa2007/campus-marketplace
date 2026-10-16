import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// All listing photos live in this Cloudinary folder
export const UPLOAD_FOLDER = 'campus-marketplace/listings';
export const ALLOWED_FORMATS = 'jpg,png,webp';

export default cloudinary;
