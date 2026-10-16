import { useState } from 'react';
import api, { errorMessage } from '../api';
import { PICKUP_POINTS, TIME_SLOTS, toDateInput } from '../constants';

const MIN_NOTICE_MS = 30 * 60 * 1000;

export default function RequestForm({ listingId, onSent }) {
  const [point, setPoint] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const min = toDateInput(new Date());
  const maxDay = new Date();
  maxDay.setDate(maxDay.getDate() + 14);
  const max = toDateInput(maxDay);

  // slots that are too soon (only matters when the chosen date is today)
  const tooSoon = (slot) => date && new Date(`${date}T${slot}`).getTime() < Date.now() + MIN_NOTICE_MS;

  const changeDate = (value) => {
    setDate(value);
    if (time && value && new Date(`${value}T${time}`).getTime() < Date.now() + MIN_NOTICE_MS) setTime('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!point) return setError('Choose a pickup point');
    if (!date) return setError('Choose a pickup date');
    if (!time) return setError('Choose a pickup time');
    setError('');
    setBusy(true);
    try {
      await api.post('/requests', {
        listingId,
        pickupPoint: point,
        pickupAt: new Date(`${date}T${time}`).toISOString(),
      });
      onSent();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="request-form" onSubmit={submit} noValidate>
      <h2>Request this item</h2>
      <p className="hint">Suggest where and when to meet. The seller can accept or reject.</p>

      <label>Pickup point
        <select value={point} onChange={(e) => setPoint(e.target.value)}>
          <option value="">Choose...</option>
          {PICKUP_POINTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </label>

      <div className="two">
        <label>Date
          <input type="date" value={date} min={min} max={max} onChange={(e) => changeDate(e.target.value)} />
        </label>
        <label>Time
          <select value={time} onChange={(e) => setTime(e.target.value)} disabled={!date}>
            <option value="">{date ? 'Choose...' : 'Pick a date first'}</option>
            {TIME_SLOTS.map((s) => <option key={s.value} value={s.value} disabled={tooSoon(s.value)}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Send request'}</button>
    </form>
  );
}
