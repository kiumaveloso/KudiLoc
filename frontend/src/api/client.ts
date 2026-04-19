// ---------------------------------------------------------------------------
// KudiLoc API client with JWT refresh-on-401 logic.
// The access token is stored in a module-level variable — never in
// localStorage or sessionStorage — matching the security model.
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

/** Module-level access token (never persisted to storage). */
let accessToken: string | null = null;

/** Set the in-memory access token (called after login / refresh). */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Read the current access token (for auth context checks). */
export function getAccessToken(): string | null {
  return accessToken;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface FetchOptions extends RequestInit {
  /** Skip the automatic 401-retry logic (used by the refresh call itself). */
  skipRetry?: boolean;
}

/**
 * Wrapper around `fetch` that:
 *  1. Prepends the API base URL.
 *  2. Injects the Authorization header when a token is present.
 *  3. Injects the X-API-Key header when configured.
 *  4. On 401, attempts a silent token refresh and retries once.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipRetry, ...init } = options;

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (API_KEY) {
    headers.set('X-API-Key', API_KEY);
  }

  const url = `${API_BASE}${path}`;

  let res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include', // send httpOnly refresh cookie
  });

  // Silent refresh on 401 (only once)
  if (res.status === 401 && !skipRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Update auth header with new token and retry
      headers.set('Authorization', `Bearer ${accessToken}`);
      res = await fetch(url, {
        ...init,
        headers,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(
      (body as { message?: string }).message ?? `API error ${res.status}`,
    ) as Error & { status: number; body: unknown };
    err.status = res.status;
    err.body = body;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

/** Attempt to refresh the access token using the httpOnly cookie. */
async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { token: string };
    accessToken = data.token;
    return true;
  } catch {
    return false;
  }
}
