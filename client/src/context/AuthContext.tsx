import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { DUMMY_EDITORS, DUMMY_VIEWERS, ALL_DUMMY_USERS } from '../data/dummyAccounts';

interface AuthContextType {
  currentUser: User;
  isEditor: boolean;
  isViewer: boolean;
  loginAsDummy: (userId: string) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: () => void;
  dummyEditors: User[];
  dummyViewers: User[];
  allDummyUsers: User[];
}

const STORAGE_KEY = 'article_hub_active_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to the first dummy editor so the user immediately experiences editor capabilities,
  // or restore previously selected user from localStorage.
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const matched = ALL_DUMMY_USERS.find((u) => u.id === parsed.id);
        if (matched) return matched;
      }
    } catch (e) {
      console.warn('Failed to parse saved user from localStorage', e);
    }
    // Default to Sarah Jenkins (Editor) for rich first-load experience, with easy viewer switch
    return DUMMY_EDITORS[0];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Failed to save user to localStorage', e);
    }
  }, [currentUser]);

  const loginAsDummy = (userId: string) => {
    const user = ALL_DUMMY_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const login = (email: string, password: string): boolean => {
    const found = ALL_DUMMY_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    // Revert to viewer guest profile
    setCurrentUser(DUMMY_VIEWERS[0]);
  };

  const switchRole = () => {
    if (currentUser.role === 'editor') {
      // Switch to first viewer
      setCurrentUser(DUMMY_VIEWERS[0]);
    } else {
      // Switch to first editor
      setCurrentUser(DUMMY_EDITORS[0]);
    }
  };

  const isEditor = currentUser.role === 'editor';
  const isViewer = currentUser.role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isEditor,
        isViewer,
        loginAsDummy,
        login,
        logout,
        switchRole,
        dummyEditors: DUMMY_EDITORS,
        dummyViewers: DUMMY_VIEWERS,
        allDummyUsers: ALL_DUMMY_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
