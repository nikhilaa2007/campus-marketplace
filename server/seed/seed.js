// Adds sample users, listings and a few demo deals.
//   npm run seed        -> clear old sample data, then add fresh sample data
//   npm run seed:clear  -> only remove the sample data
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import cloudinary, { UPLOAD_FOLDER } from '../config/cloudinary.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Request from '../models/Request.js';
import Wishlist from '../models/Wishlist.js';
import Report from '../models/Report.js';
import { SEED_DOMAIN, SEED_PASSWORD, COLLEGE, USERS, ITEMS, CATEGORY_COLOR } from './data.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.');
  process.exit(1);
}
const missing = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing in server/.env: ${missing.join(', ')}`);
  process.exit(1);
}

const DAY = 24 * 60 * 60 * 1000;
const placeholderUrl = (item) =>
  `https://placehold.co/800x600/${CATEGORY_COLOR[item.category]}/ffffff/png?text=${encodeURIComponent(item.title)}`;

async function clear() {
  const users = await User.find({ email: new RegExp(`@${SEED_DOMAIN.replace('.', '\\.')}$`) }).select('_id');
  const userIds = users.map((u) => u._id);
  const listings = await Listing.find({ seller: { $in: userIds } });
  const listingIds = listings.map((l) => l._id);

  const images = listings.flatMap((l) => l.images);
  await Promise.allSettled(images.map((i) => cloudinary.uploader.destroy(i.publicId)));

  await Request.deleteMany({ $or: [{ buyer: { $in: userIds } }, { seller: { $in: userIds } }, { listing: { $in: listingIds } }] });
  await Listing.deleteMany({ _id: { $in: listingIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  console.log(`Cleared ${users.length} sample users, ${listings.length} listings.`);
}

// --reset-all: removes EVERY listing, request, wishlist entry and report (and their Cloudinary photos).
// User accounts are kept; their ratings go back to zero because the reviews are deleted.
async function wipeEverything() {
  const listings = await Listing.find().select('images');
  await Promise.allSettled(listings.flatMap((l) => l.images).map((i) => cloudinary.uploader.destroy(i.publicId)));
  await Promise.all([Listing.deleteMany({}), Request.deleteMany({}), Wishlist.deleteMany({}), Report.deleteMany({})]);
  await User.updateMany({}, { ratingAvg: 0, ratingCount: 0 });
  console.log(`Removed all ${listings.length} listings, plus every request, wishlist entry and report.`);
}

async function uploadAll() {
  const uploaded = [];
  try {
    for (let i = 0; i < ITEMS.length; i += 5) {
      const chunk = ITEMS.slice(i, i + 5);
      const results = await Promise.all(
        chunk.map((item) =>
          cloudinary.uploader.upload(placeholderUrl(item), { folder: UPLOAD_FOLDER, tags: ['seed'] })
        )
      );
      results.forEach((r) => uploaded.push({ url: r.secure_url, publicId: r.public_id }));
      process.stdout.write(`\rUploaded photos: ${uploaded.length}/${ITEMS.length}`);
    }
    console.log();
    return uploaded;
  } catch (err) {
    console.error('\nPhoto upload failed:', err.message || err);
    await Promise.allSettled(uploaded.map((i) => cloudinary.uploader.destroy(i.publicId)));
    process.exit(1);
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  if (process.argv.includes('--reset-all')) await wipeEverything();
  await clear();
  if (process.argv.includes('--clear')) return;

  const images = await uploadAll();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = await User.insertMany(USERS.map((u) => ({ ...u, college: COLLEGE, passwordHash, isVerified: true })));

  const now = Date.now();
  const listings = [];
  for (let i = 0; i < ITEMS.length; i++) {
    const { owner, deal, ...fields } = ITEMS[i];
    const status = deal ? { pending: 'active', accepted: 'reserved', completed: 'completed' }[deal.status] : 'active';
    listings.push(
      await Listing.create({
        ...fields,
        price: fields.type === 'sell' ? fields.price : 0,
        seller: users[owner]._id,
        images: [images[i]],
        status,
        createdAt: new Date(now - (ITEMS.length - i) * 0.4 * DAY), // spread over the last week
      })
    );
  }

  // demo deals so the request screens and the receipt are not empty
  for (let i = 0; i < ITEMS.length; i++) {
    const deal = ITEMS[i].deal;
    if (!deal) continue;
    const listing = listings[i];
    const base = {
      listing: listing._id,
      buyer: users[deal.buyer]._id,
      seller: listing.seller,
      listingSnapshot: { title: listing.title, image: listing.images[0].url, price: listing.price, type: listing.type },
      status: deal.status,
    };

    if (deal.status === 'pending') {
      const pickupAt = new Date(now + 2 * DAY);
      pickupAt.setHours(15, 0, 0, 0);
      await Request.create({ ...base, pickupPoint: 'library', pickupAt });
    } else if (deal.status === 'accepted') {
      const pickupAt = new Date(now + DAY);
      pickupAt.setHours(11, 0, 0, 0);
      await Request.create({ ...base, pickupPoint: 'canteen', pickupAt, acceptedAt: new Date(now - 2 * 60 * 60 * 1000) });
    } else {
      const pickupAt = new Date(now - 3 * DAY);
      pickupAt.setHours(14, 0, 0, 0);
      const received = new Date(pickupAt.getTime() + 8 * 60 * 1000);
      await Request.create({
        ...base,
        pickupPoint: 'front-gate',
        pickupAt,
        createdAt: new Date(now - 4 * DAY),
        acceptedAt: new Date(now - 3.8 * DAY),
        sellerConfirmed: true,
        buyerConfirmed: true,
        sellerConfirmedAt: new Date(pickupAt.getTime() + 5 * 60 * 1000),
        buyerConfirmedAt: received,
        completedAt: received,
        buyerReview: { rating: 5, comment: 'Book was exactly as described. Smooth handover.', at: received },
        sellerReview: { rating: 5, comment: 'On time and polite.', at: received },
      });
      await User.updateOne({ _id: base.seller }, { ratingAvg: 5, ratingCount: 1 });
      await User.updateOne({ _id: base.buyer }, { ratingAvg: 5, ratingCount: 1 });
    }
  }

  console.log(`\nAdded ${users.length} users and ${listings.length} listings, plus 3 demo deals.`);
  console.log(`\nSample logins (password for all: ${SEED_PASSWORD})`);
  USERS.forEach((u) => console.log(`  ${u.email.padEnd(22)} ${u.name} (${u.branch}, Year ${u.year})`));
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
