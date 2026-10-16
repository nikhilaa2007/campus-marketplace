import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import ImageUploader from '../components/ImageUploader';
import { CATEGORIES, CONDITIONS } from '../constants';

const blank = { title: '', category: '', condition: '', type: 'sell', price: '', description: '', brand: '', yearOfPurchase: '', originalPrice: '' };

export default function ListingForm() {
  const { id } = useParams(); // present when editing
  const nav = useNavigate();
  const [form, setForm] = useState(blank);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    api.get(`/listings/${id}`)
      .then(({ data }) => {
        const l = data.listing;
        setForm({
          title: l.title, category: l.category, condition: l.condition, type: l.type,
          price: l.type === 'sell' ? l.price : '', description: l.description || '', brand: l.brand || '',
          yearOfPurchase: l.yearOfPurchase || '', originalPrice: l.originalPrice || '',
        });
        setImages(l.images);
      })
      .catch((e) => setServerError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = 'Enter a title (at least 3 characters)';
    if (!form.category) e.category = 'Choose a category';
    if (!form.condition) e.condition = 'Choose the condition';
    if (form.type === 'sell' && !(Number(form.price) > 0)) e.price = 'Enter a price for items you are selling';
    if (images.length < 1) e.images = 'Add at least one photo';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const payload = { ...form, images };
      const { data } = id ? await api.put(`/listings/${id}`, payload) : await api.post('/listings', payload);
      nav(`/listings/${data.listing._id}`);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="hint">Loading...</p>;

  const Err = ({ name }) => (errors[name] ? <span className="field-error">{errors[name]}</span> : null);

  return (
    <form className="form" onSubmit={submit} noValidate>
      <h1>{id ? 'Edit listing' : 'Post an item'}</h1>

      <fieldset>
        <legend>Required</legend>
        <p className="hint">Study-related items only: books and notes, electronics, lab and drawing equipment, stationery, and study essentials like a table lamp.</p>

        <label>Photos
          <ImageUploader value={images} onChange={setImages} onBusyChange={setUploading} />
          <Err name="images" />
        </label>

        <label>Title
          <input name="title" value={form.title} onChange={set} placeholder="e.g. Engineering Mathematics II, 3rd edition" maxLength={100} />
          <Err name="title" />
        </label>

        <div className="two">
          <label>Category
            <select name="category" value={form.category} onChange={set}>
              <option value="">Choose...</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <Err name="category" />
          </label>
          <label>Condition
            <select name="condition" value={form.condition} onChange={set}>
              <option value="">Choose...</option>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <Err name="condition" />
          </label>
        </div>

        <div className="two">
          <label>I want to
            <select name="type" value={form.type} onChange={set}>
              <option value="sell">Sell it</option>
              <option value="giveaway">Give it away for free</option>
            </select>
          </label>
          {form.type === 'sell' && (
            <label>Price (₹)
              <input name="price" type="number" min="1" value={form.price} onChange={set} />
              <Err name="price" />
            </label>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>Optional</legend>
        <label>Description
          <textarea name="description" rows={4} maxLength={1000} value={form.description} onChange={set} placeholder="Anything buyers should know: edition, marks, what's included" />
        </label>
        <label>Brand or author
          <input name="brand" value={form.brand} onChange={set} maxLength={80} />
        </label>
        <div className="two">
          <label>Year of purchase
            <input name="yearOfPurchase" type="number" value={form.yearOfPurchase} onChange={set} placeholder="2024" />
          </label>
          {form.type === 'sell' && (
            <label>Original price (₹)
              <input name="originalPrice" type="number" min="0" value={form.originalPrice} onChange={set} />
            </label>
          )}
        </div>
      </fieldset>

      {serverError && <p role="alert" className="error">{serverError}</p>}
      <div className="actions">
        <button className="btn" disabled={busy || uploading}>
          {uploading ? 'Uploading photos...' : busy ? 'Saving...' : id ? 'Save changes' : 'Post listing'}
        </button>
        <button type="button" className="link" onClick={() => nav(-1)}>Cancel</button>
      </div>
    </form>
  );
}
