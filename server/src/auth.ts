import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { query } from './config/database.js';

export interface AuthUser { id: string; username: string; name: string; email: string; role: 'editor'; title: string; avatar: string }

const secret = () => process.env.AUTH_SECRET || 'visual-velocity-local-dev-secret';
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');

export async function authenticateEditor(username: string, password: string): Promise<AuthUser | null> {
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const result = await query<AuthUser & { password_hash: string }>('SELECT id, username, name, email, role, title, avatar, password_hash FROM editor_users WHERE lower(username) = lower($1) LIMIT 1', [username.trim()]);
  const account = result.rows[0];
  if (!account || account.password_hash !== passwordHash) return null;
  const { password_hash: _passwordHash, ...user } = account;
  return user;
}

export function createAuthToken(user: AuthUser): string {
  const payload = encode({ sub: user.id, username: user.username, role: user.role, exp: Date.now() + 8 * 60 * 60 * 1000 });
  return `${payload}.${sign(payload)}`;
}

export function requireEditor(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') || '';
  const [payload, signature] = header.startsWith('Bearer ') ? header.slice(7).split('.') : [];
  if (!payload || !signature || sign(payload) !== signature) { res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Editor sign-in required' } }); return; }
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number };
    if (claims.role !== 'editor' || !claims.exp || claims.exp < Date.now()) throw new Error('expired');
    next();
  } catch { res.status(401).json({ success: false, error: { code: 'AUTH_INVALID', message: 'Editor session is invalid or expired' } }); }
}

export function hasValidEditorToken(req: Request): boolean {
  const header = req.header('authorization') || '';
  const [payload, signature] = header.startsWith('Bearer ') ? header.slice(7).split('.') : [];
  if (!payload || !signature || sign(payload) !== signature) return false;
  try { const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number }; return claims.role === 'editor' && claims.exp !== undefined && claims.exp > Date.now(); } catch { return false; }
}
