import { useState } from 'react';
import api, { errorMessage } from '../api';

export default function ReviewForm({ requestId, who, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Choose a rating from 1 to 5');
    setBusy(true);
    setError('');
    try {
      await api.post(`/requests/${requestId}/review`, { rating, comment });
      onDone?.();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form className="mini-form" onSubmit={submit}>
      <strong>Rate {who}</strong>
      <div className="star-row" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={n <= rating ? 'on' : ''} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={n === rating} onClick={() => setRating(n)}>★</button>
        ))}
      </div>
      <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} placeholder="Add a short comment (optional)" />
      {error && <p role="alert" className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Submit review'}</button>
    </form>
  );
}
