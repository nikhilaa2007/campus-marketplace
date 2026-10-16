import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, mode, switchMode, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [drops, setDrops] = useState(0);

  // number of saved items whose price dropped (refreshed whenever the page changes)
  useEffect(() => {
    if (mode !== 'buyer') return;
    api.get('/wishlist/ids').then((r) => setDrops(r.data.dropCount)).catch(() => {});
  }, [location.pathname, mode]);

  const changeMode = (m) => {
    switchMode(m);
    nav(m === 'seller' ? '/my-listings' : '/');
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">Campus Marketplace</NavLink>
      <nav>
        {mode === 'buyer' ? (
          <>
            <NavLink to="/" end>Browse</NavLink>
            <NavLink to="/wishlist">Wishlist{drops > 0 && <span className="dot" title="Price drops">{drops}</span>}</NavLink>
            <NavLink to="/my-requests">My requests</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/my-listings">My listings</NavLink>
            <NavLink to="/requests-received">Requests</NavLink>
            <NavLink to="/listings/new">Post an item</NavLink>
          </>
        )}
      </nav>
      <div className="nav-right">
        <div className="mode-toggle" role="group" aria-label="Mode">
          <button className={mode === 'buyer' ? 'on' : ''} onClick={() => changeMode('buyer')}>Buyer</button>
          <button className={mode === 'seller' ? 'on' : ''} onClick={() => changeMode('seller')}>Seller</button>
        </div>
        <span className="who">{user.name}</span>
        <button className="link" onClick={logout}>Log out</button>
      </div>
    </header>
  );
}
