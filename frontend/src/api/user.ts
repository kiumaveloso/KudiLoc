// ---------------------------------------------------------------------------
// User & Leaderboard API calls
// ---------------------------------------------------------------------------

import { apiFetch } from './client';
import type { LeaderboardEntry, UserDto } from '../types';

export async function getUserById(id: string): Promise<UserDto> {
  return apiFetch<UserDto>(`/user/${id}`);
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  return apiFetch<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`);
}
