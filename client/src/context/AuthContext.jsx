import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Buyer/Seller is just a UI mode, not an account type
  const [mode, setMode] = useState(localStorage.getItem('mode') || 'buyer');

  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false);
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem('token', token);
    setUser(user);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  const switchMode = (m) => {
    localStorage.setItem('mode', m);
    setMode(m);
  };

  return (
    <AuthContext.Provider value={{ user, loading, mode, switchMode, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
