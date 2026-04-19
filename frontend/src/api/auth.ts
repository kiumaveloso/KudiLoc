// ---------------------------------------------------------------------------
// Auth API calls
// ---------------------------------------------------------------------------

import { apiFetch, setAccessToken } from './client';
import type { AuthResponse, OtpResponse, UserDto } from '../types';

/** Request an OTP code sent via SMS. */
export async function requestOtp(phoneNumber: string): Promise<OtpResponse> {
  return apiFetch<OtpResponse>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
    skipRetry: true,
  } as Parameters<typeof apiFetch>[1]);
}

/** Verify the OTP and receive a JWT access token. */
export async function verifyOtp(
  phoneNumber: string,
  otpCode: string,
): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, otpCode }),
    skipRetry: true,
  } as Parameters<typeof apiFetch>[1]);
  // Store token in memory
  setAccessToken(res.token);
  return res;
}

/** Refresh the access token using the httpOnly cookie. */
export async function refreshToken(): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/refresh', {
    method: 'POST',
    skipRetry: true,
  } as Parameters<typeof apiFetch>[1]);
  setAccessToken(res.token);
  return res;
}

/** Logout — revoke refresh token and clear cookie. */
export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
  setAccessToken(null);
}

/** Get the currently authenticated user's profile. */
export async function getCurrentUser(): Promise<UserDto> {
  return apiFetch<UserDto>('/auth/me');
}
