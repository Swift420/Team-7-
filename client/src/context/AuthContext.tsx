import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "../types";
import { AuthContext } from "./AuthContextValue";
import { loginEditor, setApiAuthToken } from "../services/api";

const GUEST_USER: User = {
  id: "guest",
  username: "guest",
  name: "Guest Reader",
  email: "",
  role: "viewer",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80",
  title: "Public Reader",
};
const STORAGE_KEY = "article_hub_active_user";
const TOKEN_KEY = "article_hub_editor_token";

// Restore editor state before the first render; viewers never need a login to read published content.
function getStoredAuth(): {
  user: User;
  isAuthenticated: boolean;
  token: string | null;
} {
  if (typeof window === "undefined")
    return { user: GUEST_USER, isAuthenticated: false, token: null };
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { user: GUEST_USER, isAuthenticated: false, token: null };

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    ) as User | null;
    if (saved?.role === "editor")
      return { user: saved, isAuthenticated: true, token };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { user: GUEST_USER, isAuthenticated: false, token: null };
}

/** Viewers remain anonymous; editor privileges only come from a server-issued token. */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storedAuth] = useState(getStoredAuth);
  const [currentUser, setCurrentUser] = useState<User>(storedAuth.user);
  const [isAuthenticated, setIsAuthenticated] = useState(
    storedAuth.isAuthenticated,
  );

  useEffect(() => {
    setApiAuthToken(storedAuth.token);
  }, [storedAuth.token]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await loginEditor(username, password);
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
      setApiAuthToken(result.token);
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setApiAuthToken(null);
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
  }, []);
  const switchRole = useCallback(() => {
    if (isAuthenticated) logout();
  }, [isAuthenticated, logout]);
  const contextValue = useMemo(
    () => ({
      currentUser,
      isEditor: isAuthenticated,
      isViewer: !isAuthenticated,
      isAuthenticated,
      login,
      logout,
      switchRole,
    }),
    [currentUser, isAuthenticated, login, logout, switchRole],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
