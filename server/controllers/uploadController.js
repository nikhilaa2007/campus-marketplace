import cloudinary, { UPLOAD_FOLDER, ALLOWED_FORMATS } from '../config/cloudinary.js';

// GET /api/uploads/signature
// Gives the logged-in browser a short-lived permission to upload ONE image straight to Cloudinary.
// The API secret never leaves the server; only the resulting signature is sent.
export function getUploadSignature(_req, res) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: UPLOAD_FOLDER, allowed_formats: ALLOWED_FORMATS };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

  res.json({
    signature,
    timestamp,
    folder: UPLOAD_FOLDER,
    allowedFormats: ALLOWED_FORMATS,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
