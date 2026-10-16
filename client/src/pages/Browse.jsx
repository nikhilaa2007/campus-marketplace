import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import ListingCard from '../components/ListingCard';
import { CATEGORIES, CONDITIONS } from '../constants';

const empty = { search: '', category: '', type: '', condition: '', minPrice: '', maxPrice: '' };

export default function Browse() {
  const [filters, setFilters] = useState(empty);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ listings: [], totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishIds, setWishIds] = useState(new Set());

  const set = (e) => { setFilters({ ...filters, [e.target.name]: e.target.value }); setPage(1); };

  useEffect(() => {
    // small delay so we don't search on every keystroke
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = Object.fromEntries(Object.entries({ ...filters, page }).filter(([, v]) => v !== ''));
        const res = await api.get('/listings', { params });
        setData(res.data);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [filters, page]);

  useEffect(() => {
    api.get('/wishlist/ids').then((r) => setWishIds(new Set(r.data.ids))).catch(() => {});
  }, []);

  const toggleWish = async (id) => {
    const had = wishIds.has(id);
    const next = new Set(wishIds);
    had ? next.delete(id) : next.add(id);
    setWishIds(next); // update the heart immediately
    try {
      if (had) await api.delete(`/wishlist/${id}`);
      else await api.post(`/wishlist/${id}`);
    } catch (e) {
      setWishIds(wishIds); // undo if it failed
      setError(errorMessage(e));
    }
  };

  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <h1>Browse items</h1>
      <div className="filters">
        <input name="search" placeholder="Search books, calculators, lab coats..." value={filters.search} onChange={set} />
        <select name="category" value={filters.category} onChange={set} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select name="type" value={filters.type} onChange={set} aria-label="Type">
          <option value="">Sale and free</option>
          <option value="sell">For sale</option>
          <option value="giveaway">Free</option>
        </select>
        <select name="condition" value={filters.condition} onChange={set} aria-label="Condition">
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input name="minPrice" type="number" min="0" placeholder="Min ₹" value={filters.minPrice} onChange={set} />
        <input name="maxPrice" type="number" min="0" placeholder="Max ₹" value={filters.maxPrice} onChange={set} />
        {filtered && <button className="link" onClick={() => { setFilters(empty); setPage(1); }}>Clear filters</button>}
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      {loading && <p className="hint">Loading...</p>}

      {!loading && !error && data.listings.length === 0 && (
        <p className="empty">{filtered ? 'No items match these filters. Try clearing some.' : 'No items yet. Switch to Seller mode to post the first one.'}</p>
      )}

      <div className="grid">
        {data.listings.map((l) => <ListingCard key={l._id} listing={l} wished={wishIds.has(l._id)} onToggleWish={toggleWish} />)}
      </div>

      {data.totalPages > 1 && (
        <div className="pager">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
