import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('trimurl_token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize token and user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('trimurl_token');
      const storedUser = localStorage.getItem('trimurl_user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed parsing stored user data:", e);
          // Corrupt storage, clear
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login Handler
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: receivedToken, user: userData } = response.data;
      
      localStorage.setItem('trimurl_token', receivedToken);
      localStorage.setItem('trimurl_user', JSON.stringify(userData));
      
      setToken(receivedToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0]?.message || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  // Register Handler
  const register = async (username, email, password) => {
    try {
      const response = await api.post('/api/auth/register', { username, email, password });
      const { token: receivedToken, user: userData } = response.data;

      localStorage.setItem('trimurl_token', receivedToken);
      localStorage.setItem('trimurl_user', JSON.stringify(userData));

      setToken(receivedToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0]?.message || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  // Logout Handler
  const logout = () => {
    localStorage.removeItem('trimurl_token');
    localStorage.removeItem('trimurl_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to consume AuthContext easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
