import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { loginEditor, setApiAuthToken } from '../services/api';

const GUEST_USER: User = { id: 'guest', username: 'guest', name: 'Guest Reader', email: '', role: 'viewer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80', title: 'Public Reader' };
const STORAGE_KEY = 'article_hub_active_user';
const TOKEN_KEY = 'article_hub_editor_token';

interface AuthContextType {
  currentUser: User;
  isEditor: boolean;
  isViewer: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    setApiAuthToken(token);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as User | null;
      if (token && saved?.role === 'editor') { setCurrentUser(saved); setIsAuthenticated(true); }
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const result = await loginEditor(username, password);
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
      setApiAuthToken(result.token); setCurrentUser(result.user); setIsAuthenticated(true);
      return true;
    } catch { return false; }
  };

  const logout = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(STORAGE_KEY); setApiAuthToken(null); setCurrentUser(GUEST_USER); setIsAuthenticated(false); };
  const switchRole = () => { if (isAuthenticated) logout(); };

  return <AuthContext.Provider value={{ currentUser, isEditor: isAuthenticated, isViewer: !isAuthenticated, isAuthenticated, login, logout, switchRole }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
