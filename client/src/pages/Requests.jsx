import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import RequestCard from '../components/RequestCard';

const TABS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'pending', label: 'Pending', match: (r) => r.status === 'pending' },
  { key: 'accepted', label: 'Accepted', match: (r) => r.status === 'accepted' },
  { key: 'completed', label: 'Completed', match: (r) => r.status === 'completed' },
  { key: 'closed', label: 'Closed', match: (r) => r.status === 'rejected' || r.status === 'cancelled' },
];

// role = 'buyer' -> "My requests", role = 'seller' -> "Requests received"
export default function Requests({ role }) {
  const [requests, setRequests] = useState(null);
  const [tab, setTab] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api.get(role === 'buyer' ? '/requests/sent' : '/requests/received')
      .then((r) => setRequests(r.data.requests))
      .catch((e) => setError(errorMessage(e)));

  useEffect(() => { setRequests(null); setTab('all'); load(); }, [role]); // eslint-disable-line

  const act = async (id, action) => {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/requests/${id}/${action}`);
    } catch (e) {
      setError(errorMessage(e));
    }
    await load(); // always refresh so the screen matches the server
    setBusy(false);
  };

  const current = TABS.find((t) => t.key === tab);
  const shown = requests?.filter(current.match) || [];

  return (
    <>
      <h1>{role === 'buyer' ? 'My requests' : 'Requests received'}</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.label}{requests ? ` (${requests.filter(t.match).length})` : ''}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      {!requests && !error && <p className="hint">Loading...</p>}
      {requests && shown.length === 0 && (
        <p className="empty">
          {requests.length === 0
            ? role === 'buyer' ? 'You have not requested anything yet. Browse items and send a request.' : 'No requests yet. They will show up here when buyers ask for your items.'
            : 'Nothing in this tab.'}
        </p>
      )}

      <div className="req-list">
        {shown.map((r) => <RequestCard key={r._id} request={r} role={role} busy={busy} onAction={act} onChanged={load} />)}
      </div>
    </>
  );
}
