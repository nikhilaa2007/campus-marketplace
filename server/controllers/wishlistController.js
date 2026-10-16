import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Listing from '../models/Listing.js';

const SELLER = 'name branch year college ratingAvg ratingCount';

// GET /api/wishlist
export async function getWishlist(req, res) {
  const rows = await Wishlist.find({ user: req.user._id })
    .sort('-createdAt')
    .populate({ path: 'listing', populate: { path: 'seller', select: SELLER } });

  const items = rows
    .filter((r) => r.listing) // listing was deleted
    .map((r) => ({
      _id: r._id,
      listing: r.listing,
      priceWhenSaved: r.priceWhenSaved,
      priceDropped: r.listing.price < r.priceWhenSaved,
    }));
  res.json({ items });
}

// GET /api/wishlist/ids   (hearts on the browse page + the navbar count)
export async function getWishlistIds(req, res) {
  const rows = await Wishlist.find({ user: req.user._id }).populate('listing', 'price status');
  const live = rows.filter((r) => r.listing);
  const dropCount = live.filter((r) => r.listing.status === 'active' && r.listing.price < r.priceWhenSaved).length;
  res.json({ ids: live.map((r) => String(r.listing._id)), dropCount });
}

// POST /api/wishlist/:listingId
export async function addToWishlist(req, res) {
  if (!mongoose.isValidObjectId(req.params.listingId)) return res.status(404).json({ message: 'Item not found' });
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) return res.status(404).json({ message: 'Item not found' });
  if (listing.seller.equals(req.user._id)) return res.status(400).json({ message: 'You cannot save your own item' });

  await Wishlist.findOneAndUpdate(
    { user: req.user._id, listing: listing._id },
    { $setOnInsert: { priceWhenSaved: listing.price } },
    { upsert: true }
  );
  res.status(201).json({ message: 'Saved' });
}

// DELETE /api/wishlist/:listingId
export async function removeFromWishlist(req, res) {
  await Wishlist.deleteOne({ user: req.user._id, listing: req.params.listingId });
  res.json({ message: 'Removed' });
}
