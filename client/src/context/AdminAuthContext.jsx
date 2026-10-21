import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from './ToastContext';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const { showToast } = useToast();

  // Clear legacy tokens from persistent localStorage for security compliance
  useEffect(() => {
    try {
      localStorage.removeItem('aura_admin_token');
      localStorage.removeItem('aura_admin_user');
    } catch (e) {}
  }, []);

  // Use sessionStorage and secure cookies for session persistence across page refreshes
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem('aura_admin_token') || null;
    } catch {
      return null;
    }
  });

  const [admin, setAdmin] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aura_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Verify session on startup and page refresh
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      setLoading(true);
      try {
        // Calls /api/admin/me (authenticated via Bearer token in sessionStorage or HttpOnly session cookie)
        const profile = await api.getAdminProfile();
        if (isMounted && profile && profile.id) {
          setAdmin(profile);
          sessionStorage.setItem('aura_admin_user', JSON.stringify(profile));
        }
      } catch (err) {
        if (isMounted) {
          // If session expired or invalid, reset admin state cleanly
          sessionStorage.removeItem('aura_admin_token');
          sessionStorage.removeItem('aura_admin_user');
          setToken(null);
          setAdmin(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (identifier, password) => {
    try {
      const data = await api.adminLogin(identifier, password);
      sessionStorage.setItem('aura_admin_token', data.token);
      sessionStorage.setItem('aura_admin_user', JSON.stringify(data.admin));
      setToken(data.token);
      setAdmin(data.admin);
      showToast(`Welcome back, ${data.admin.username}`, 'success');
      return data;
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
      throw err;
    }
  };

  const logout = async (notify = true) => {
    try {
      await api.adminLogout().catch(() => {});
    } catch (e) {}
    sessionStorage.removeItem('aura_admin_token');
    sessionStorage.removeItem('aura_admin_user');
    setToken(null);
    setAdmin(null);
    if (notify) {
      showToast('Logged out of admin console', 'info');
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        token,
        admin,
        isAuthenticated: Boolean(admin),
        loading,
        login,
        logout
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
