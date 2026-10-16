import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const nav = useNavigate();
  const { saveSession } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      saveSession(data);
      nav('/');
    } catch (err) {
      // Account exists but email isn't verified yet: send them to the code screen
      if (err.response?.data?.needsVerification) {
        await api.post('/auth/resend-otp', { email: form.email });
        return nav('/verify', { state: { email: form.email } });
      }
      setError(errorMessage(err));
    }
  };

  return (
    <main style={{ maxWidth: 380, margin: '40px auto', padding: 16 }}>
      <h1>Log in</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <input type="email" placeholder="College email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p role="alert" style={{ color: 'crimson', margin: 0 }}>{error}</p>}
        <button>Log in</button>
      </form>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </main>
  );
}
