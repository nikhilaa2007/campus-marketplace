import { useAuth } from '../context/AuthContext';

// Placeholder: listings and the buyer/seller dashboards will replace this
export default function Home() {
  const { user, mode, switchMode, logout } = useAuth();
  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
      <h1>Hi, {user.name}</h1>
      <p>{user.branch}, Year {user.year}, {user.college}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={mode === 'buyer'} onClick={() => switchMode('buyer')}>Buyer mode</button>
        <button disabled={mode === 'seller'} onClick={() => switchMode('seller')}>Seller mode</button>
        <button onClick={logout}>Log out</button>
      </div>
      <p>You are in <strong>{mode}</strong> mode. Listings come next.</p>
    </main>
  );
}
