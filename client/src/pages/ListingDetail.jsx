import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import RequestForm from '../components/RequestForm';
import ReportForm from '../components/ReportForm';
import { CATEGORIES, CONDITIONS, PICKUP_POINTS, LISTING_REASONS, labelOf, formatPrice, formatWhen } from '../constants';
import { thumb } from '../utils/images';

export default function ListingDetail() {
  const { id } = useParams();
  const { user, mode, switchMode } = useAuth();
  const nav = useNavigate();
  const [listing, setListing] = useState(null);
  const [myRequest, setMyRequest] = useState(null);
  const [wished, setWished] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState('');

  const load = () =>
    api.get(`/listings/${id}`)
      .then((r) => { setListing(r.data.listing); setMyRequest(r.data.myRequest); setWished(r.data.wishlisted); })
      .catch((e) => setError(errorMessage(e)));

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  if (error) return <p role="alert" className="error">{error}</p>;
  if (!listing) return <p className="hint">Loading...</p>;

  const isOwner = listing.seller._id === user.id;
  const canChange = isOwner && listing.status === 'active';

  const toggleWish = async () => {
    try {
      if (wished) await api.delete(`/wishlist/${id}`);
      else await api.post(`/wishlist/${id}`);
      setWished(!wished);
    } catch (e) {
      window.alert(errorMessage(e));
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this listing? Pending requests on it will be cancelled.')) return;
    try {
      await api.delete(`/listings/${id}`);
      nav('/my-listings');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="detail">
      <div>
        <img className="detail-main" src={thumb(listing.images[active].url, 900, 675)} alt={listing.title} />
        {listing.images.length > 1 && (
          <div className="thumbs">
            {listing.images.map((img, i) => (
              <button key={img.publicId} className={i === active ? 'on' : ''} onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`}>
                <img src={thumb(img.url, 120, 120)} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1>{listing.title}</h1>
        <p className={`price big${listing.type === 'giveaway' ? ' free' : ''}`}>{formatPrice(listing)}</p>
        {listing.originalPrice > 0 && listing.type === 'sell' && (
          <p className="meta">Bought for ₹{listing.originalPrice.toLocaleString('en-IN')}</p>
        )}
        {listing.status !== 'active' && <span className="badge">{listing.status}</span>}

        <dl className="facts">
          <dt>Category</dt><dd>{labelOf(CATEGORIES, listing.category)}</dd>
          <dt>Condition</dt><dd>{labelOf(CONDITIONS, listing.condition)}</dd>
          {listing.brand && <><dt>Brand / author</dt><dd>{listing.brand}</dd></>}
          {listing.yearOfPurchase && <><dt>Bought in</dt><dd>{listing.yearOfPurchase}</dd></>}
        </dl>

        {listing.description && <p className="description">{listing.description}</p>}

        <div className="seller-box">
          <strong>{listing.seller.name}</strong>
          <span>{listing.seller.branch}, Year {listing.seller.year}</span>
          <span>{listing.seller.college}</span>
          <span>{listing.seller.ratingCount > 0 ? `★ ${listing.seller.ratingAvg} (${listing.seller.ratingCount} review${listing.seller.ratingCount > 1 ? 's' : ''})` : 'No reviews yet'}</span>
        </div>

        {!isOwner && (
          <div className="actions">
            <button type="button" className="btn ghost" onClick={toggleWish}>{wished ? '♥ Saved to wishlist' : '♡ Save to wishlist'}</button>
            <ReportForm type="listing" targetId={listing._id} reasons={LISTING_REASONS} />
          </div>
        )}

        {isOwner && mode === 'buyer' ? (
          <div className="request-form">
            <h2>This is your listing</h2>
            <p className="hint">You can't request your own item. Switch to Seller mode to edit it or see its requests.</p>
            <button className="btn" onClick={() => switchMode('seller')}>Switch to Seller mode</button>
          </div>
        ) : isOwner ? (
          <div className="actions">
            {canChange && <Link className="btn" to={`/listings/${id}/edit`}>Edit listing</Link>}
            {canChange && <button className="btn danger" onClick={remove}>Delete</button>}
            {!canChange && <p className="hint">This listing is part of a deal and can no longer be changed.</p>}
            <Link to="/requests-received">View requests</Link>
          </div>
        ) : myRequest ? (
          <div className="request-form">
            <h2>Your request is {myRequest.status}</h2>
            <p>
              <strong>{labelOf(PICKUP_POINTS, myRequest.pickupPoint)}</strong> · {formatWhen(myRequest.pickupAt)}
            </p>
            <Link to="/my-requests">Go to My requests</Link>
          </div>
        ) : listing.status === 'active' ? (
          <RequestForm listingId={listing._id} onSent={load} />
        ) : (
          <p className="hint">This item is no longer available.</p>
        )}
      </div>
    </div>
  );
}
