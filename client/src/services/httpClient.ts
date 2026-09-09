const API_BASE = '/api';

let authToken: string | null = null;

export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

/** Reads the body once and gives every API caller consistent parsing errors. */
export async function readJson<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    if (response.status === 204) return null as T;
    throw new Error(response.ok ? 'The server returned an empty response' : `The API is unavailable or returned an empty response (${response.status})`);
  }
  try { return JSON.parse(text) as T; }
  catch { throw new Error(`The API returned an invalid response (${response.status})`); }
}

/** Shared request boundary: adds the editor token and unwraps the server response envelope. */
export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  const response = await fetch(url, { ...options, headers });
  const payload = await readJson<{ data?: T; error?: { message?: string; details?: string[] } } | null>(response);
  if (!response.ok) {
    const message = payload?.error?.message || `Request failed (${response.status})`;
    const details = payload?.error?.details || [];
    throw new ApiError(details.length ? `${message}: ${details.join('; ')}` : message, response.status, details);
  }
  return payload?.data as T;
}

export { API_BASE };
