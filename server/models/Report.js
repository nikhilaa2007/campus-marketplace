import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deal', 'listing'], required: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' }, // when type = deal
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }, // when type = listing
    reason: { type: String, required: true },
    details: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
