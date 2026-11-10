import { createContext, useContext, useEffect, useState } from 'react';
import { TOKEN_KEY } from '../api/axios.js';
import * as authApi from '../api/auth.api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then((res) => setUser(res.data.data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAuthResponse(res) {
    const { user: nextUser, token } = res.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    setUser(nextUser);
    return nextUser;
  }

  async function login(payload) {
    return handleAuthResponse(await authApi.login(payload));
  }

  async function register(payload) {
    return handleAuthResponse(await authApi.register(payload));
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Logout is client-side for JWTs: clearing the token is what matters.
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin: user?.role === 'admin', login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
