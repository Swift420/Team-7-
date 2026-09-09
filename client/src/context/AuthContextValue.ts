import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextType { currentUser: User; isEditor: boolean; isViewer: boolean; isAuthenticated: boolean; login: (username: string, password: string) => Promise<boolean>; logout: () => void; switchRole: () => void; }
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
