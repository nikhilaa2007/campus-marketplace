import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { saveSession } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!state?.email) return <Navigate to="/register" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email: state.email, code });
      saveSession(data);
      nav('/');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const resend = async () => {
    setError('');
    try {
      await api.post('/auth/resend-otp', { email: state.email });
      setInfo('New code sent');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <main style={{ maxWidth: 380, margin: '40px auto', padding: 16 }}>
      <h1>Verify your email</h1>
      <p>Enter the 6-digit code we sent to {state.email}.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" required />
        {error && <p role="alert" style={{ color: 'crimson', margin: 0 }}>{error}</p>}
        {info && <p style={{ margin: 0 }}>{info}</p>}
        <button>Verify</button>
      </form>
      <p><button type="button" onClick={resend}>Send a new code</button></p>
    </main>
  );
}
