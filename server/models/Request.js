import mongoose from 'mongoose';
import { PICKUP_POINTS, TYPES } from '../utils/constants.js';

const reviewSchema = new mongoose.Schema(
  { rating: { type: Number, min: 1, max: 5 }, comment: { type: String, maxlength: 300 }, at: Date },
  { _id: false }
);

// One document = one request AND its deal. Status flow:
// pending -> accepted -> completed   (side exits: rejected, cancelled)
const requestSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // copy of the item details, so history still makes sense if the listing is deleted
    listingSnapshot: {
      title: String,
      image: String,
      price: Number,
      type: { type: String, enum: TYPES },
    },

    pickupPoint: { type: String, enum: PICKUP_POINTS, required: true },
    pickupAt: { type: Date, required: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    cancelledBy: { type: String, enum: ['buyer', 'seller'] },

    sellerConfirmed: { type: Boolean, default: false }, // "I handed it over"
    buyerConfirmed: { type: Boolean, default: false }, // "I received it"
    buyerReview: reviewSchema, // buyer's rating of the seller
    sellerReview: reviewSchema, // seller's rating of the buyer
    sellerConfirmedAt: Date, // when the seller tapped "I handed it over"
    buyerConfirmedAt: Date, // when the buyer tapped "I received it"
    acceptedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Request', requestSchema);
