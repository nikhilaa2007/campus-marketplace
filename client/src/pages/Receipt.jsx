import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { PICKUP_POINTS, labelOf, formatFull } from '../constants';

export default function Receipt() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/requests/${id}/receipt`).then((r) => setData(r.data)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <p role="alert" className="error">{error}</p>;
  if (!data) return <p className="hint">Loading...</p>;

  const { request: r, receiptNo } = data;
  const snap = r.listingSnapshot;
  const isFree = snap.type === 'giveaway';
  const person = (p) => `${p.name}, ${p.branch}, Year ${p.year}, ${p.college}`;

  return (
    <>
      <div className="actions no-print">
        <button className="btn" onClick={() => window.print()}>Download / Print as PDF</button>
        <Link to="/my-requests">Back to requests</Link>
      </div>

      <section className="receipt" aria-label="Transaction receipt">
        <header>
          <h1>Campus Marketplace</h1>
          <p className="meta">Digital transaction receipt</p>
          <p><strong>Receipt no:</strong> {receiptNo}</p>
        </header>

        <h2>Item</h2>
        <dl>
          <dt>Item</dt><dd>{snap.title}</dd>
          <dt>Deal type</dt><dd>{isFree ? 'Given away for free' : 'Sold'}</dd>
          <dt>Agreed amount</dt><dd>{isFree ? 'Free' : `₹${Number(snap.price).toLocaleString('en-IN')}`}</dd>
        </dl>

        <h2>People</h2>
        <dl>
          <dt>Seller</dt><dd>{person(r.seller)}</dd>
          <dt>Buyer</dt><dd>{person(r.buyer)}</dd>
        </dl>

        <h2>Handover record</h2>
        <dl>
          <dt>Request sent</dt><dd>{formatFull(r.createdAt)}</dd>
          <dt>Accepted by seller</dt><dd>{formatFull(r.acceptedAt)}</dd>
          <dt>Pickup arranged for</dt><dd>{labelOf(PICKUP_POINTS, r.pickupPoint)}, {formatFull(r.pickupAt)}</dd>
          <dt>Handed over by seller</dt><dd>{formatFull(r.sellerConfirmedAt)}</dd>
          <dt>Received and acknowledged by buyer</dt><dd>{formatFull(r.buyerConfirmedAt)}</dd>
          <dt>Deal completed</dt><dd>{formatFull(r.completedAt)}</dd>
        </dl>

        <p className="meta fine">
          Generated from Campus Marketplace records. The app does not handle payments; any payment was settled directly between the buyer and seller.
        </p>
      </section>
    </>
  );
}
