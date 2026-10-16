import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import ListingCard from '../components/ListingCard';

export default function MyListings() {
  const [listings, setListings] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/listings/mine').then((r) => setListings(r.data.listings)).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/listings/${id}`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <div className="row">
        <h1>My listings</h1>
        <Link className="btn" to="/listings/new">Post an item</Link>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      {listings && listings.length === 0 && <p className="empty">You have not posted anything yet. Post your first item to get started.</p>}
      <div className="grid">
        {listings?.map((l) => (
          <ListingCard key={l._id} listing={l}>
            {l.status === 'active' && (
              <div className="card-actions">
                <Link to={`/listings/${l._id}/edit`}>Edit</Link>
                <button className="link danger" onClick={() => remove(l._id)}>Delete</button>
              </div>
            )}
          </ListingCard>
        ))}
      </div>
    </>
  );
}
