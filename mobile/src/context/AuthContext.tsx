// ---------------------------------------------------------------------------
// Auth context -- provides user state + login/logout across the app.
// On mount, attempts a silent refresh using the stored refresh token.
// ---------------------------------------------------------------------------

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse, UserDto } from '../types';
import {
  refreshToken,
  logout as apiLogout,
  getCurrentUser,
} from '../api/auth';
import { getAccessTokenSync, loadTokenFromStore } from '../api/client';

interface AuthState {
  /** True while the initial silent-refresh is in progress. */
  loading: boolean;
  user: UserDto | null;
  authInfo: AuthResponse | null;
  isAuthenticated: boolean;
  /** Called after OTP verify succeeds (stores AuthResponse). */
  onLoginSuccess: (auth: AuthResponse) => void;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
}

const DEMO_USER: UserDto = {
  id: 'demo-user-001',
  name: 'Utilizador Demo',
  reputationScore: 120,
  totalReports: 8,
  accurateReports: 7,
  role: 'User',
  createdAt: new Date().toISOString(),
};

const DEMO_AUTH: AuthResponse = {
  token: 'demo-token',
  userId: 'demo-user-001',
  name: 'Utilizador Demo',
  reputationScore: 120,
  refreshToken: undefined,
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authInfo, setAuthInfo] = useState<AuthResponse | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);

  // Attempt silent refresh on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Load any persisted access token first
      await loadTokenFromStore();

      try {
        const auth = await refreshToken();
        if (!cancelled) {
          setAuthInfo(auth);
          try {
            const profile = await getCurrentUser();
            if (!cancelled) setUser(profile);
          } catch {
            // Profile fetch failed -- still treat as logged-in with partial info
          }
        }
      } catch {
        // No valid refresh token -- user is not logged in
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onLoginSuccess = useCallback(async (auth: AuthResponse) => {
    setAuthInfo(auth);
    try {
      const profile = await getCurrentUser();
      setUser(profile);
    } catch {
      // Fallback: build minimal user from auth response
      setUser({
        id: auth.userId,
        name: auth.name,
        reputationScore: auth.reputationScore,
        totalReports: 0,
        accurateReports: 0,
        role: 'User',
        createdAt: new Date().toISOString(),
      });
    }
  }, []);

  const loginAsDemo = useCallback(() => {
    setAuthInfo(DEMO_AUTH);
    setUser(DEMO_USER);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Best-effort
    }
    setAuthInfo(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      authInfo,
      isAuthenticated: !!authInfo,
      onLoginSuccess,
      loginAsDemo,
      logout,
    }),
    [loading, user, authInfo, onLoginSuccess, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
