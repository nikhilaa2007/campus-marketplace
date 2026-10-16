import { Link } from 'react-router-dom';
import { CATEGORIES, CONDITIONS, labelOf, formatPrice } from '../constants';
import { thumb } from '../utils/images';

// onToggleWish is optional: when given, a heart button is shown
export default function ListingCard({ listing, children, wished, onToggleWish }) {
  return (
    <article className="card">
      {onToggleWish && (
        <button type="button" className={`wish${wished ? ' on' : ''}`} aria-pressed={Boolean(wished)}
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => onToggleWish(listing._id)}>
          {wished ? '♥' : '♡'}
        </button>
      )}
      <Link to={`/listings/${listing._id}`} className="card-link">
        <img src={thumb(listing.images[0].url, 480, 360)} alt={listing.title} loading="lazy" />
        <div className="card-body">
          <h3>{listing.title}</h3>
          <p className={`price${listing.type === 'giveaway' ? ' free' : ''}`}>{formatPrice(listing)}</p>
          <p className="meta">{labelOf(CATEGORIES, listing.category)} · {labelOf(CONDITIONS, listing.condition)}</p>
          {listing.status !== 'active' && <span className="badge">{listing.status}</span>}
        </div>
      </Link>
      {children}
    </article>
  );
}
