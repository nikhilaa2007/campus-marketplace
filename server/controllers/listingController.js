import mongoose from 'mongoose';
import { z } from 'zod';
import Listing from '../models/Listing.js';
import Request from '../models/Request.js';
import Wishlist from '../models/Wishlist.js';
import cloudinary, { UPLOAD_FOLDER } from '../config/cloudinary.js';
import { CATEGORIES, CONDITIONS, TYPES, MAX_IMAGES } from '../utils/constants.js';

// ---------- validation ----------
// This marketplace is for study-related items only. Edit this list to change what is blocked.
const NOT_ALLOWED = /\b(hoodies?|(t-?)?shirts?|jeans|sarees?|kurtas?|dresses|shoes?|sneakers?|slippers?|sandals|bed ?sheets?|pillows?|mattress(es)?|blankets?|curtains?)\b/i;

// Empty strings from the form become "not provided"
const optionalNumber = (min = 0) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ invalid_type_error: 'Enter a valid number' }).min(min, 'Cannot be negative').optional()
  );

const optionalText = (max) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(max, `Maximum ${max} characters`).optional());

// Only accept images that really came from OUR Cloudinary folder
const imageSchema = z
  .object({ url: z.string().url(), publicId: z.string() })
  .refine(
    (i) =>
      i.url.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`) &&
      i.publicId.startsWith(`${UPLOAD_FOLDER}/`),
    { message: 'Invalid photo' }
  );

const listingSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a category' }) }),
    condition: z.enum(CONDITIONS, { errorMap: () => ({ message: 'Choose the item condition' }) }),
    type: z.enum(TYPES, { errorMap: () => ({ message: 'Choose sell or give away' }) }),
    price: optionalNumber(),
    images: z
      .array(imageSchema, { required_error: 'Add at least one photo' })
      .min(1, 'Add at least one photo')
      .max(MAX_IMAGES, `You can add up to ${MAX_IMAGES} photos`),
    description: optionalText(1000),
    brand: optionalText(80),
    yearOfPurchase: z.preprocess(
      (v) => (v === '' || v == null ? undefined : Number(v)),
      z.number().int().min(2000, 'Enter a valid year').max(new Date().getFullYear(), 'Year cannot be in the future').optional()
    ),
    originalPrice: optionalNumber(),
  })
  .superRefine((d, ctx) => {
    if (NOT_ALLOWED.test(d.title)) {
      ctx.addIssue({
        code: 'custom',
        path: ['title'],
        message: 'This marketplace is for study-related items only. Clothing, bedding and similar items are not allowed.',
      });
    }
    if (d.type === 'sell' && (d.price == null || d.price <= 0)) {
      ctx.addIssue({ code: 'custom', path: ['price'], message: 'Enter a price for items you are selling' });
    }
  });

const firstError = (result) => result.error.issues[0].message;

// ---------- helpers ----------
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const deleteFromCloudinary = (images) =>
  Promise.allSettled(images.map((i) => cloudinary.uploader.destroy(i.publicId)));

// Loads a listing and makes sure the logged-in user owns it and it can still be changed
async function findEditable(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Listing not found' });
    return null;
  }
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404).json({ message: 'Listing not found' });
    return null;
  }
  if (!listing.seller.equals(req.user._id)) {
    res.status(403).json({ message: 'You can only change your own listings' });
    return null;
  }
  if (listing.status !== 'active') {
    res.status(409).json({ message: 'This listing is part of a deal and can no longer be changed' });
    return null;
  }
  return listing;
}

const SELLER_FIELDS = 'name branch year college ratingAvg ratingCount';

// ---------- handlers ----------

// POST /api/listings
export async function createListing(req, res) {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: firstError(parsed) });

  const data = parsed.data;
  const listing = await Listing.create({
    ...data,
    price: data.type === 'sell' ? data.price : 0,
    seller: req.user._id,
  });
  res.status(201).json({ listing });
}

// GET /api/listings?search=&category=&type=&condition=&minPrice=&maxPrice=&page=
export async function getListings(req, res) {
  const { search, category, type, condition, minPrice, maxPrice } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 12;

  // a student never sees their own items in the marketplace
  const filter = { status: 'active', seller: { $ne: req.user._id } };
  if (search?.trim()) {
    const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
    filter.$or = [{ title: rx }, { brand: rx }, { description: rx }];
  }
  if (CATEGORIES.includes(category)) filter.category = category;
  if (TYPES.includes(type)) filter.type = type;
  if (CONDITIONS.includes(condition)) filter.condition = condition;

  const min = minPrice === undefined || minPrice === '' ? NaN : Number(minPrice);
  const max = maxPrice === undefined || maxPrice === '' ? NaN : Number(maxPrice);
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    filter.price = {};
    if (!Number.isNaN(min)) filter.price.$gte = min;
    if (!Number.isNaN(max)) filter.price.$lte = max;
  }

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('seller', SELLER_FIELDS),
    Listing.countDocuments(filter),
  ]);

  res.json({ listings, page, totalPages: Math.max(1, Math.ceil(total / limit)), total });
}

// GET /api/listings/mine
export async function getMyListings(req, res) {
  const listings = await Listing.find({ seller: req.user._id }).sort('-createdAt');
  res.json({ listings });
}

// GET /api/listings/:id
export async function getListing(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  const listing = await Listing.findById(req.params.id).populate('seller', SELLER_FIELDS);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  // lets the page show "you already requested this" instead of the request form
  const myRequest = await Request.findOne({
    listing: listing._id, buyer: req.user._id, status: { $in: ['pending', 'accepted'] },
  });
  const wishlisted = Boolean(await Wishlist.exists({ user: req.user._id, listing: listing._id }));
  res.json({ listing, myRequest, wishlisted });
}

// PUT /api/listings/:id
export async function updateListing(req, res) {
  const listing = await findEditable(req, res);
  if (!listing) return;

  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: firstError(parsed) });
  const data = parsed.data;

  // Photos that were removed in the edit form must also be removed from Cloudinary
  const keptIds = new Set(data.images.map((i) => i.publicId));
  const removed = listing.images.filter((i) => !keptIds.has(i.publicId));

  listing.set({
    ...data,
    price: data.type === 'sell' ? data.price : 0,
    // clear optional fields that were emptied in the form
    description: data.description ?? undefined,
    brand: data.brand ?? undefined,
    yearOfPurchase: data.yearOfPurchase ?? undefined,
    originalPrice: data.originalPrice ?? undefined,
  });
  await listing.save();
  await deleteFromCloudinary(removed);

  res.json({ listing });
}

// DELETE /api/listings/:id
export async function deleteListing(req, res) {
  const listing = await findEditable(req, res);
  if (!listing) return;

  await deleteFromCloudinary(listing.images);
  await Request.updateMany({ listing: listing._id, status: 'pending' }, { status: 'cancelled', cancelledBy: 'seller' });
  await Wishlist.deleteMany({ listing: listing._id });
  await listing.deleteOne();
  res.json({ message: 'Listing deleted' });
}
