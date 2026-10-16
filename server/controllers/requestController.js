import mongoose from 'mongoose';
import { z } from 'zod';
import Request from '../models/Request.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { PICKUP_POINTS } from '../utils/constants.js';

const createSchema = z.object({
  listingId: z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid item'),
  pickupPoint: z.enum(PICKUP_POINTS, { errorMap: () => ({ message: 'Choose a pickup point' }) }),
  pickupAt: z.string({ required_error: 'Choose a pickup date and time' }).datetime({ message: 'Choose a pickup date and time' }),
});

const MIN_NOTICE_MS = 30 * 60 * 1000; // at least 30 minutes from now
const MAX_AHEAD_MS = 14 * 24 * 60 * 60 * 1000; // within 14 days
const PERSON = 'name branch year college ratingAvg ratingCount';

// Loads a request and works out whether the logged-in user is its buyer or seller
async function load(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Request not found' });
    return null;
  }
  const request = await Request.findById(req.params.id);
  const isBuyer = request?.buyer.equals(req.user._id);
  const isSeller = request?.seller.equals(req.user._id);
  if (!request || (!isBuyer && !isSeller)) {
    res.status(404).json({ message: 'Request not found' });
    return null;
  }
  return { request, isBuyer, isSeller };
}

// POST /api/requests
export async function createRequest(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { listingId, pickupPoint } = parsed.data;

  const when = new Date(parsed.data.pickupAt);
  if (when.getTime() < Date.now() + MIN_NOTICE_MS) {
    return res.status(400).json({ message: 'Pick a time at least 30 minutes from now' });
  }
  if (when.getTime() > Date.now() + MAX_AHEAD_MS) {
    return res.status(400).json({ message: 'Pick a date within the next 14 days' });
  }

  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ message: 'Item not found' });
  if (listing.seller.equals(req.user._id)) {
    return res.status(400).json({ message: 'You cannot request your own item' });
  }
  if (listing.status !== 'active') {
    return res.status(409).json({ message: 'This item is no longer available' });
  }

  const open = await Request.findOne({ listing: listing._id, buyer: req.user._id, status: { $in: ['pending', 'accepted'] } });
  if (open) return res.status(409).json({ message: 'You already have an open request for this item' });

  const request = await Request.create({
    listing: listing._id,
    buyer: req.user._id,
    seller: listing.seller,
    listingSnapshot: {
      title: listing.title,
      image: listing.images[0].url,
      price: listing.price,
      type: listing.type,
    },
    pickupPoint,
    pickupAt: when,
  });
  res.status(201).json({ request });
}

// GET /api/requests/sent      (buyer mode: my requests)
export async function getSent(req, res) {
  const requests = await Request.find({ buyer: req.user._id }).sort('-createdAt').populate('seller', PERSON);
  res.json({ requests });
}

// GET /api/requests/received  (seller mode: requests on my items)
export async function getReceived(req, res) {
  const requests = await Request.find({ seller: req.user._id }).sort('-createdAt').populate('buyer', PERSON);
  res.json({ requests });
}

// PATCH /api/requests/:id/accept   (seller)
export async function acceptRequest(req, res) {
  const ctx = await load(req, res);
  if (!ctx) return;
  const { request, isSeller } = ctx;

  if (!isSeller) return res.status(403).json({ message: 'Only the seller can accept a request' });
  if (request.status !== 'pending') return res.status(409).json({ message: 'This request is no longer pending' });
  if (request.pickupAt.getTime() < Date.now()) {
    return res.status(409).json({ message: 'The proposed pickup time has already passed. Reject this request' });
  }

  // Atomic guard: only one request can ever reserve the item
  const reserved = await Listing.findOneAndUpdate({ _id: request.listing, status: 'active' }, { status: 'reserved' });
  if (!reserved) return res.status(409).json({ message: 'This item is no longer available' });

  request.status = 'accepted';
  request.acceptedAt = new Date();
  await request.save();

  // everyone else waiting on this item is declined automatically
  await Request.updateMany({ listing: request.listing, _id: { $ne: request._id }, status: 'pending' }, { status: 'rejected' });

  res.json({ request });
}

// PATCH /api/requests/:id/reject   (seller)
export async function rejectRequest(req, res) {
  const ctx = await load(req, res);
  if (!ctx) return;
  const { request, isSeller } = ctx;

  if (!isSeller) return res.status(403).json({ message: 'Only the seller can reject a request' });
  if (request.status !== 'pending') return res.status(409).json({ message: 'This request is no longer pending' });

  request.status = 'rejected';
  await request.save();
  res.json({ request });
}

// PATCH /api/requests/:id/cancel
// buyer: can cancel while pending or accepted. seller: can cancel only after accepting.
export async function cancelRequest(req, res) {
  const ctx = await load(req, res);
  if (!ctx) return;
  const { request, isBuyer } = ctx;

  const allowed = request.status === 'accepted' || (request.status === 'pending' && isBuyer);
  if (!allowed) return res.status(409).json({ message: 'This request cannot be cancelled now' });

  const wasAccepted = request.status === 'accepted';
  request.status = 'cancelled';
  request.cancelledBy = isBuyer ? 'buyer' : 'seller';
  await request.save();

  // an accepted deal that falls through puts the item back on the marketplace
  if (wasAccepted) await Listing.updateOne({ _id: request.listing, status: 'reserved' }, { status: 'active' });

  res.json({ request });
}

// PATCH /api/requests/:id/confirm
// seller = "I handed it over", buyer = "I received it". Completed only when BOTH have confirmed.
export async function confirmRequest(req, res) {
  const ctx = await load(req, res);
  if (!ctx) return;
  const { request, isBuyer } = ctx;

  if (request.status !== 'accepted') {
    return res.status(409).json({ message: 'Only an accepted deal can be confirmed' });
  }

  const flag = isBuyer ? 'buyerConfirmed' : 'sellerConfirmed';
  const updated = await Request.findOneAndUpdate({ _id: request._id, status: 'accepted' }, { [flag]: true, [`${flag}At`]: new Date() }, { new: true });
  if (!updated) return res.status(409).json({ message: 'This deal changed. Refresh and try again' });

  if (updated.buyerConfirmed && updated.sellerConfirmed) {
    updated.status = 'completed';
    updated.completedAt = new Date();
    await updated.save();
    await Listing.updateOne({ _id: updated.listing }, { status: 'completed' });
  }
  res.json({ request: updated });
}

// GET /api/requests/:id/receipt   (buyer or seller, completed deals only)
export async function getReceipt(req, res) {
  const ctx = await load(req, res);
  if (!ctx) return;
  if (ctx.request.status !== 'completed') {
    return res.status(409).json({ message: 'A receipt is available only after the deal is completed' });
  }
  const request = await ctx.request.populate([
    { path: 'buyer', select: PERSON },
    { path: 'seller', select: PERSON },
  ]);
  const receiptNo = `CM-${String(request._id).slice(-8).toUpperCase()}`;
  res.json({ request, receiptNo });
}

// ---------- reviews ----------
const reviewInput = z.object({
  rating: z.coerce.number({ invalid_type_error: 'Choose a rating from 1 to 5' }).int().min(1, 'Choose a rating from 1 to 5').max(5, 'Choose a rating from 1 to 5'),
  comment: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(300, 'Comment is too long').optional()),
});

// Recalculates a user's average from every review they received (always exact)
async function recomputeRating(userId) {
  const [asSeller, asBuyer] = await Promise.all([
    Request.find({ seller: userId, 'buyerReview.rating': { $exists: true } }).select('buyerReview.rating'),
    Request.find({ buyer: userId, 'sellerReview.rating': { $exists: true } }).select('sellerReview.rating'),
  ]);
  const ratings = [...asSeller.map((r) => r.buyerReview.rating), ...asBuyer.map((r) => r.sellerReview.rating)];
  const count = ratings.length;
  const avg = count ? Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
  await User.updateOne({ _id: userId }, { ratingAvg: avg, ratingCount: count });
}

// POST /api/requests/:id/review   (buyer or seller, completed deals, once each)
export async function reviewRequest(req, res) {
  const ctx = await load(req, res);
  if (!ctx) return;
  const { request, isBuyer } = ctx;

  if (request.status !== 'completed') return res.status(409).json({ message: 'You can review a deal after it is completed' });

  const field = isBuyer ? 'buyerReview' : 'sellerReview';
  if (request[field]?.rating) return res.status(409).json({ message: 'You already reviewed this deal' });

  const parsed = reviewInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

  request[field] = { rating: parsed.data.rating, comment: parsed.data.comment, at: new Date() };
  await request.save();
  await recomputeRating(isBuyer ? request.seller : request.buyer);

  res.json({ request });
}
