import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { query } from './config/database.js';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'editor';
  title: string;
  avatar: string;
}

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured in production');
  }
  return s || 'visual-velocity-nzz-hack-secret-2026';
};

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');

function verifySignature(payload: string, signature: string): boolean {
  try {
    const expected = sign(payload);
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(signature);
    if (expectedBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}

// Built-in verified editor profiles (available immediately with or without Postgres)
export const DEFAULT_EDITORS: (AuthUser & { passwordHash: string })[] = [
  {
    id: 'user-editor-teofilus',
    username: 'teofilus',
    name: 'Teofilus Shaduka',
    email: 'teofilus@nzz.ch',
    role: 'editor',
    title: 'Lead Editor & Multimodal Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    passwordHash: crypto.createHash('sha256').update('editor123').digest('hex'),
  },
  {
    id: 'user-editor-1',
    username: 'sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.editor@journal.io',
    role: 'editor',
    title: 'Lead Editor, Tech & Data',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    passwordHash: crypto.createHash('sha256').update('editor123').digest('hex'),
  },
  {
    id: 'user-editor-2',
    username: 'marcus',
    name: 'Marcus Vance',
    email: 'marcus.writer@journal.io',
    role: 'editor',
    title: 'Senior Investigative Editor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    passwordHash: crypto.createHash('sha256').update('editor123').digest('hex'),
  },
  {
    id: 'user-editor-3',
    username: 'elena',
    name: 'Elena Rostova',
    email: 'elena.dev@journal.io',
    role: 'editor',
    title: 'Visual Journalism & AI Editor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    passwordHash: crypto.createHash('sha256').update('editor123').digest('hex'),
  },
];

export async function authenticateEditor(username: string, password: string): Promise<AuthUser | null> {
  const cleanUsername = username.trim().toLowerCase();
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

  // 1. Check built-in editor profiles
  const matched = DEFAULT_EDITORS.find(
    (e) => e.username.toLowerCase() === cleanUsername && e.passwordHash === passwordHash
  );
  if (matched) {
    const { passwordHash: _, ...user } = matched;
    return user;
  }

  // 2. Query Postgres database if configured and available
  try {
    const result = await query<AuthUser & { password_hash: string }>(
      'SELECT id, username, name, email, role, title, avatar, password_hash FROM editor_users WHERE lower(username) = lower($1) LIMIT 1',
      [cleanUsername]
    );
    const account = result.rows[0];
    if (account && account.password_hash === passwordHash) {
      const { password_hash: _passwordHash, ...user } = account;
      return user;
    }
  } catch {
    // Database unconfigured/offline
  }

  return null;
}

export function createAuthToken(user: AuthUser): string {
  const payload = encode({ sub: user.id, username: user.username, role: user.role, exp: Date.now() + 8 * 60 * 60 * 1000 });
  return `${payload}.${sign(payload)}`;
}

export function requireEditor(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') || '';
  const [payload, signature] = header.startsWith('Bearer ') ? header.slice(7).split('.') : [];
  if (!payload || !signature || !verifySignature(payload, signature)) {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Editor sign-in required' } });
    return;
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number };
    if (claims.role !== 'editor' || !claims.exp || claims.exp < Date.now()) throw new Error('expired');
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_INVALID', message: 'Editor session is invalid or expired' } });
  }
}

export function hasValidEditorToken(req: Request): boolean {
  const header = req.header('authorization') || '';
  const [payload, signature] = header.startsWith('Bearer ') ? header.slice(7).split('.') : [];
  if (!payload || !signature || !verifySignature(payload, signature)) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number };
    return claims.role === 'editor' && claims.exp !== undefined && claims.exp > Date.now();
  } catch {
    return false;
  }
}
