import axios from 'axios'; // plain axios on purpose: Cloudinary must not get our login token
import api from '../api';
import { shrinkImage } from './images';

const MAX_BYTES = 5 * 1024 * 1024;

// Uploads one image straight to Cloudinary using a signature from our server.
// Returns { url, publicId }, which is what we save in MongoDB.
export async function uploadImage(file, onProgress) {
  const blob = await shrinkImage(file);
  if (blob.size > MAX_BYTES) throw new Error('Photo is larger than 5 MB');

  const { data: sig } = await api.get('/uploads/signature');

  const form = new FormData();
  form.append('file', blob);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  form.append('allowed_formats', sig.allowedFormats);

  try {
    const res = await axios.post(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, form, {
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
    });
    return { url: res.data.secure_url, publicId: res.data.public_id };
  } catch (err) {
    throw new Error(err.response?.data?.error?.message || 'Upload failed. Check your connection and retry');
  }
}
