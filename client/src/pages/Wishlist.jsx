import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import ListingCard from '../components/ListingCard';

export default function Wishlist() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/wishlist').then((r) => setItems(r.data.items)).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);

  const remove = async (listingId) => {
    try {
      await api.delete(`/wishlist/${listingId}`);
      setItems((list) => list.filter((i) => i.listing._id !== listingId));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <h1>My wishlist</h1>
      {error && <p role="alert" className="error">{error}</p>}
      {!items && !error && <p className="hint">Loading...</p>}
      {items && items.length === 0 && <p className="empty">Nothing saved yet. Tap the heart on an item to save it here. We will flag it when the price drops.</p>}
      <div className="grid">
        {items?.map((i) => (
          <ListingCard key={i._id} listing={i.listing}>
            <div className="card-actions">
              {i.priceDropped ? (
                <span className="drop">Price dropped from ₹{i.priceWhenSaved.toLocaleString('en-IN')}</span>
              ) : <span />}
              <button className="link danger" onClick={() => remove(i.listing._id)}>Remove</button>
            </div>
          </ListingCard>
        ))}
      </div>
    </>
  );
}
