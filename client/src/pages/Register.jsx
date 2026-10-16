import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', branch: '', year: 1, college: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', form);
      nav('/verify', { state: { email: data.email } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ maxWidth: 380, margin: '40px auto', padding: 16 }}>
      <h1>Create your account</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <input name="name" placeholder="Full name" value={form.name} onChange={set} required />
        <input name="email" type="email" placeholder="College email" value={form.email} onChange={set} required />
        <input name="password" type="password" placeholder="Password (6+ characters)" value={form.password} onChange={set} required />
        <input name="college" placeholder="College" value={form.college} onChange={set} required />
        <input name="branch" placeholder="Branch (e.g. CSE)" value={form.branch} onChange={set} required />
        <select name="year" value={form.year} onChange={set}>
          {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        {error && <p role="alert" style={{ color: 'crimson', margin: 0 }}>{error}</p>}
        <button disabled={busy}>{busy ? 'Sending code...' : 'Create account'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </main>
  );
}
