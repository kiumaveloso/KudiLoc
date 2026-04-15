// ---------------------------------------------------------------------------
// KudiLoc API client for React Native.
// Access token stored in expo-secure-store.  Refresh token also stored in
// SecureStore (httpOnly cookies are not accessible from native apps).
// Automatic silent retry on 401.
// ---------------------------------------------------------------------------

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

const TOKEN_KEY = 'kudiloc_access_token';
const REFRESH_TOKEN_KEY = 'kudiloc_refresh_token';

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

let accessToken: string | null = null;

export async function loadTokenFromStore(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // SecureStore not available on web -- fall back to sessionStorage
      accessToken =
        typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem(TOKEN_KEY)
          : null;
    } else {
      accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch {
    accessToken = null;
  }
  return accessToken;
}

export async function setAccessToken(token: string | null): Promise<void> {
  accessToken = token;
  try {
    if (Platform.OS === 'web') {
      if (typeof sessionStorage !== 'undefined') {
        if (token) sessionStorage.setItem(TOKEN_KEY, token);
        else sessionStorage.removeItem(TOKEN_KEY);
      }
    } else {
      if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Best effort
  }
}

export async function setRefreshToken(token: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof sessionStorage !== 'undefined') {
        if (token) sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
        else sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } else {
      if (token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch {
    // Best effort
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem(REFRESH_TOKEN_KEY)
        : null;
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAccessTokenSync(): string | null {
  return accessToken;
}

// ---------------------------------------------------------------------------
// Snake_case → camelCase transformer
// Recursively converts all object keys returned by the API.
// ---------------------------------------------------------------------------

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function camelizeKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(camelizeKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        snakeToCamel(k),
        camelizeKeys(v),
      ]),
    );
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface FetchOptions extends RequestInit {
  skipRetry?: boolean;
  /** Max attempts on network/5xx errors (default 3). Set to 1 to disable. */
  retries?: number;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipRetry, retries = 3, ...init } = options;

  const headers: Record<string, string> = {};

  // Merge any existing headers
  if (init.headers) {
    const h = init.headers as Record<string, string>;
    Object.keys(h).forEach((k) => {
      headers[k] = h[k];
    });
  }

  if (!headers['Content-Type'] && init.body && typeof init.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = `${API_BASE}${path}`;

  // Network-level retry with exponential backoff (helps when Render is waking up)
  let res: Response | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      res = await fetchWithTimeout(url, { ...init, headers });
      break;
    } catch {
      if (attempt < retries) {
        await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
      } else {
        throw new Error('Sem ligação ao servidor. Verifica a tua ligação à internet.');
      }
    }
  }

  // Silent refresh on 401
  if (res!.status === 401 && !skipRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetchWithTimeout(url, { ...init, headers });
    }
  }

  if (!res!.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = (await res!.json()) as Record<string, unknown>;
    } catch {
      // ignore parse errors
    }
    const err = new Error(
      (body.message as string) ?? `API error ${res!.status}`,
    ) as Error & { status: number; body: unknown };
    err.status = res!.status;
    err.body = body;
    throw err;
  }

  if (res!.status === 204) return undefined as unknown as T;
  const json = await res!.json();
  return camelizeKeys(json) as T;
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshTok = await getRefreshToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const body = refreshTok ? JSON.stringify({ refresh_token: refreshTok }) : undefined;

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers,
      body,
      credentials: 'include',
    });
    if (!res.ok) return false;

    const raw = await res.json();
    const data = camelizeKeys(raw) as { token: string; refreshToken?: string };
    await setAccessToken(data.token);
    if (data.refreshToken) {
      await setRefreshToken(data.refreshToken);
    }
    return true;
  } catch {
    return false;
  }
}
