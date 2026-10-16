import { useState } from 'react';
import api, { errorMessage } from '../api';

// type = 'deal' or 'listing'
export default function ReportForm({ type, targetId, reasons }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (sent) return <span className="hint">Report submitted. Thank you.</span>;
  if (!open) return <button type="button" className="link danger" onClick={() => setOpen(true)}>{type === 'deal' ? 'Report an issue' : 'Report this listing'}</button>;

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return setError('Choose a reason');
    setBusy(true);
    setError('');
    try {
      await api.post('/reports', { type, targetId, reason, details });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form className="mini-form" onSubmit={submit}>
      <strong>{type === 'deal' ? 'Report an issue with this deal' : 'Report this listing'}</strong>
      <select value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="">Choose a reason...</option>
        {reasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <textarea rows={2} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Details (required if you chose 'Something else')" />
      {error && <p role="alert" className="error">{error}</p>}
      <div className="actions">
        <button className="btn danger" disabled={busy}>{busy ? 'Sending...' : 'Submit report'}</button>
        <button type="button" className="link" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
