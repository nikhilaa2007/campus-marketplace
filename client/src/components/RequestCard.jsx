import { Link } from 'react-router-dom';
import { PICKUP_POINTS, DEAL_REASONS, labelOf, formatWhen, stars } from '../constants';
import { thumb } from '../utils/images';
import ReviewForm from './ReviewForm';
import ReportForm from './ReportForm';

const STATUS = {
  pending: 'Pending', accepted: 'Accepted', completed: 'Completed', rejected: 'Rejected', cancelled: 'Cancelled',
};

// role = 'buyer' (My requests) or 'seller' (Requests received)
export default function RequestCard({ request: r, role, busy, onAction, onChanged }) {
  const other = role === 'buyer' ? r.seller : r.buyer;
  const youConfirmed = role === 'buyer' ? r.buyerConfirmed : r.sellerConfirmed;
  const theyConfirmed = role === 'buyer' ? r.sellerConfirmed : r.buyerConfirmed;
  const snap = r.listingSnapshot;
  const myReview = role === 'buyer' ? r.buyerReview : r.sellerReview;
  const theirReview = role === 'buyer' ? r.sellerReview : r.buyerReview;
  const price = snap.type === 'giveaway' ? 'Free' : `₹${Number(snap.price).toLocaleString('en-IN')}`;

  const ask = (action, message) => {
    if (!message || window.confirm(message)) onAction(r._id, action);
  };

  return (
    <article className="req">
      <img src={thumb(snap.image, 200, 200)} alt="" />
      <div className="req-main">
        <div className="row">
          <h3><Link to={`/listings/${r.listing}`}>{snap.title}</Link></h3>
          <span className={`badge st-${r.status}`}>{STATUS[r.status]}</span>
        </div>
        <p className="meta">{price} · {role === 'buyer' ? 'Seller' : 'Buyer'}: {other.name} ({other.branch}, Year {other.year}){other.ratingCount > 0 && ` · ★ ${other.ratingAvg} (${other.ratingCount})`}</p>
        <p className="pickup">
          <strong>{labelOf(PICKUP_POINTS, r.pickupPoint)}</strong> · {formatWhen(r.pickupAt)}
        </p>

        {r.status === 'accepted' && (
          <p className="meta">
            Seller handed over: {r.sellerConfirmed ? `Yes${r.sellerConfirmedAt ? ` (${formatWhen(r.sellerConfirmedAt)})` : ''}` : 'Not yet'}
            {' · '}Buyer received: {r.buyerConfirmed ? `Yes${r.buyerConfirmedAt ? ` (${formatWhen(r.buyerConfirmedAt)})` : ''}` : 'Not yet'}
          </p>
        )}
        {r.status === 'completed' && (
          <p className="meta">Completed on {formatWhen(r.completedAt)} · <Link to={`/receipts/${r._id}`}>View receipt</Link></p>
        )}
        {r.status === 'cancelled' && r.cancelledBy && (
          <p className="meta">Cancelled by {r.cancelledBy === role ? 'you' : r.cancelledBy}</p>
        )}

        {r.status === 'completed' && (
          <div className="reviews">
            {myReview?.rating ? (
              <p className="meta">You rated {other.name}: <span className="stars">{stars(myReview.rating)}</span>{myReview.comment ? ` "${myReview.comment}"` : ''}</p>
            ) : (
              <ReviewForm requestId={r._id} who={other.name} onDone={onChanged} />
            )}
            {theirReview?.rating && (
              <p className="meta">{other.name} rated you: <span className="stars">{stars(theirReview.rating)}</span>{theirReview.comment ? ` "${theirReview.comment}"` : ''}</p>
            )}
          </div>
        )}
        {(r.status === 'accepted' || r.status === 'completed') && (
          <div className="report-row"><ReportForm type="deal" targetId={r._id} reasons={DEAL_REASONS} /></div>
        )}

        <div className="actions">
          {role === 'seller' && r.status === 'pending' && (
            <>
              <button className="btn" disabled={busy} onClick={() => ask('accept', 'Accept this request? Other pending requests for this item will be declined.')}>Accept</button>
              <button className="btn danger" disabled={busy} onClick={() => ask('reject')}>Reject</button>
            </>
          )}
          {role === 'buyer' && r.status === 'pending' && (
            <button className="btn danger" disabled={busy} onClick={() => ask('cancel', 'Cancel this request?')}>Cancel request</button>
          )}
          {r.status === 'accepted' && (
            <>
              {youConfirmed ? (
                <span className="hint">You confirmed.{theyConfirmed ? '' : ` Waiting for the ${role === 'buyer' ? 'seller' : 'buyer'}.`}</span>
              ) : (
                <button className="btn" disabled={busy} onClick={() => ask('confirm', role === 'buyer' ? 'Confirm that you received the item?' : 'Confirm that you handed the item over?')}>
                  {role === 'buyer' ? 'I received it' : 'I handed it over'}
                </button>
              )}
              <button className="btn danger" disabled={busy} onClick={() => ask('cancel', 'Cancel this deal? The item goes back on the marketplace.')}>Cancel deal</button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
