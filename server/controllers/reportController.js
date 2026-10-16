import mongoose from 'mongoose';
import { z } from 'zod';
import Report from '../models/Report.js';
import Request from '../models/Request.js';
import Listing from '../models/Listing.js';

const REASONS = {
  deal: ['item-not-received', 'wrong-item', 'handover-problem', 'other'],
  listing: ['not-study-related', 'misleading', 'inappropriate', 'other'],
};

const schema = z.object({
  type: z.enum(['deal', 'listing']),
  targetId: z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid report target'),
  reason: z.string().min(1, 'Choose a reason'),
  details: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(500, 'Details are too long').optional()),
});

// POST /api/reports   { type: 'deal' | 'listing', targetId, reason, details }
export async function createReport(req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { type, targetId, reason, details } = parsed.data;

  if (!REASONS[type].includes(reason)) return res.status(400).json({ message: 'Choose a reason' });
  if (reason === 'other' && !details) return res.status(400).json({ message: 'Please describe the problem' });

  const doc = { reporter: req.user._id, type, reason, details };

  if (type === 'deal') {
    const request = await Request.findById(targetId);
    const isBuyer = request?.buyer.equals(req.user._id);
    const isSeller = request?.seller.equals(req.user._id);
    if (!request || (!isBuyer && !isSeller)) return res.status(404).json({ message: 'Deal not found' });
    if (!['accepted', 'completed'].includes(request.status)) {
      return res.status(409).json({ message: 'You can report a deal once it has been accepted' });
    }
    doc.request = request._id;
    doc.reportedUser = isBuyer ? request.seller : request.buyer;
  } else {
    const listing = await Listing.findById(targetId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.equals(req.user._id)) return res.status(400).json({ message: 'You cannot report your own listing' });
    doc.listing = listing._id;
    doc.reportedUser = listing.seller;
  }

  const dup = await Report.findOne({
    reporter: req.user._id, type, status: 'open',
    ...(type === 'deal' ? { request: doc.request } : { listing: doc.listing }),
  });
  if (dup) return res.status(409).json({ message: 'You already reported this. We will look into it' });

  await Report.create(doc);
  res.status(201).json({ message: 'Report submitted' });
}
