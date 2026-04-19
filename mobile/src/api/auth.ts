// ---------------------------------------------------------------------------
// Auth API calls
// ---------------------------------------------------------------------------

import {
  apiFetch,
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
} from './client';
import type { AuthResponse, OtpResponse, UserDto } from '../types';

/** Request an OTP code sent via SMS. */
export async function requestOtp(phoneNumber: string): Promise<OtpResponse> {
  return apiFetch<OtpResponse>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber }),
    skipRetry: true,
  } as Parameters<typeof apiFetch>[1]);
}

/** Verify the OTP and receive a JWT access token. */
export async function verifyOtp(
  phoneNumber: string,
  otpCode: string,
  name?: string,
): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse & { refreshToken?: string }>(
    '/auth/otp/verify',
    {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode, name }),
      skipRetry: true,
    } as Parameters<typeof apiFetch>[1],
  );
  await setAccessToken(res.token);
  if (res.refreshToken) {
    await setRefreshToken(res.refreshToken);
  }
  return res;
}

/** Refresh the access token using the stored refresh token. */
export async function refreshToken(): Promise<AuthResponse> {
  const refreshTok = await getRefreshToken();
  const body = refreshTok
    ? JSON.stringify({ refresh_token: refreshTok })
    : undefined;

  const res = await apiFetch<AuthResponse & { refreshToken?: string }>(
    '/auth/refresh',
    {
      method: 'POST',
      body,
      skipRetry: true,
    } as Parameters<typeof apiFetch>[1],
  );
  await setAccessToken(res.token);
  if (res.refreshToken) {
    await setRefreshToken(res.refreshToken);
  }
  return res;
}

/** Logout -- revoke refresh token and clear stored tokens. */
export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Best effort
  }
  await setAccessToken(null);
  await setRefreshToken(null);
}

/** Get the currently authenticated user's profile. */
export async function getCurrentUser(): Promise<UserDto> {
  return apiFetch<UserDto>('/auth/me');
}
