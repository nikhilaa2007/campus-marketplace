export const CATEGORIES = [
  { value: 'textbooks', label: 'Textbooks' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'lab-equipment', label: 'Lab equipment' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'study-essentials', label: 'Study essentials' },
];

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

export const labelOf = (list, value) => list.find((i) => i.value === value)?.label || value;

export const formatPrice = (listing) =>
  listing.type === 'giveaway' ? 'Free' : `₹${Number(listing.price).toLocaleString('en-IN')}`;

export const PICKUP_POINTS = [
  { value: 'back-gate', label: 'Back gate' },
  { value: 'front-gate', label: 'Front gate' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'library', label: 'Library' },
];

// 9:00 AM to 5:30 PM in 30-minute slots
export const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const mins = 9 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return { value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, label };
});

// yyyy-mm-dd in the user's local time (what <input type="date"> expects)
export const toDateInput = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const formatWhen = (iso) =>
  new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// Full date and time for receipts
export const formatFull = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Not recorded';

export const DEAL_REASONS = [
  { value: 'item-not-received', label: 'Item not received' },
  { value: 'wrong-item', label: 'Wrong or incorrect item' },
  { value: 'handover-problem', label: 'Handover problem (no-show, late, other)' },
  { value: 'other', label: 'Something else' },
];

export const LISTING_REASONS = [
  { value: 'not-study-related', label: 'Not a study-related item' },
  { value: 'misleading', label: 'Misleading photos or description' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Something else' },
];

export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
