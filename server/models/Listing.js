import mongoose from 'mongoose';
import { CATEGORIES, CONDITIONS, TYPES } from '../utils/constants.js';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // needed to delete the file from Cloudinary later
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // mandatory
    title: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: CATEGORIES, required: true },
    condition: { type: String, enum: CONDITIONS, required: true },
    type: { type: String, enum: TYPES, required: true },
    price: { type: Number, default: 0, min: 0 }, // 0 for giveaways
    images: { type: [imageSchema], validate: [(v) => v.length >= 1 && v.length <= 5, '1 to 5 photos required'] },

    // optional
    description: { type: String, trim: true, maxlength: 1000 },
    brand: { type: String, trim: true, maxlength: 80 },
    yearOfPurchase: { type: Number },
    originalPrice: { type: Number, min: 0 },

    status: { type: String, enum: ['active', 'reserved', 'completed'], default: 'active', index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Listing', listingSchema);
