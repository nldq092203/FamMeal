import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query'
import { authService } from '@/api/auth.service';
import { getApiErrorMessage } from '@/api/error';
import { useToast } from '@/context/ToastContext';
import { userService } from '@/api/user.service';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';
import { getStoredUser } from '@/utils/session';
import { useFamilyStore } from '@/stores/familyStore'

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function clearSession() {
  authService.logout();
  window.dispatchEvent(new Event('auth:logout'));
}

function scheduleNonBlocking(work: () => void) {
  const requestIdleCallback = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number })
    .requestIdleCallback

  if (requestIdleCallback) {
    requestIdleCallback(work, { timeout: 2000 })
    return
  }

  setTimeout(work, 500)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { error: showErrorToast } = useToast();
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authEpochRef = useRef(0)

  const setUserAndStore = useCallback((nextUser: User | null) => {
    if (!nextUser) {
      localStorage.removeItem('user');
      setUser(null);
      return;
    }
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const resetAppForAuthChange = useCallback(() => {
    queryClient.cancelQueries().catch(() => undefined)
    queryClient.clear()
    useFamilyStore.getState().setFamilyId(null)
  }, [queryClient])

  const refreshUser = useCallback(async () => {
    const epoch = authEpochRef.current
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      if (epoch !== authEpochRef.current) return;
      setUserAndStore(null);
      return;
    }
    const me = await authService.getCurrentUser();
    if (epoch !== authEpochRef.current) return;
    if (me.id) {
      try {
        const full = await userService.getUser(me.id);
        if (epoch !== authEpochRef.current) return;
        setUserAndStore({ ...me, ...full, id: me.id });
        return;
      } catch {
        if (epoch !== authEpochRef.current) return;
        setUserAndStore(me);
        return;
      }
    }
    if (epoch !== authEpochRef.current) return;
    setUserAndStore(me);
  }, [setUserAndStore]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    refreshUser()
      .catch((err) => {
        if (cancelled) return;
        const message = getApiErrorMessage(err, 'Authentication failed.');
        setError(message);
        showErrorToast(message);
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      cancelled = true;
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [refreshUser, showErrorToast]);

  const login = useCallback(async (data: LoginRequest) => {
    setError(null);
    const payload = await authService.login(data);
    authEpochRef.current += 1
    resetAppForAuthChange()
    setUserAndStore(payload.user);
    scheduleNonBlocking(() => refreshUser().catch(() => undefined));
    return payload;
  }, [refreshUser, resetAppForAuthChange, setUserAndStore]);

  const register = useCallback(async (data: RegisterRequest) => {
    setError(null);
    const payload = await authService.register(data);
    authEpochRef.current += 1
    resetAppForAuthChange()
    setUserAndStore(payload.user);
    scheduleNonBlocking(() => refreshUser().catch(() => undefined));
    return payload;
  }, [refreshUser, resetAppForAuthChange, setUserAndStore]);

  const logout = useCallback(() => {
    authEpochRef.current += 1
    clearSession();
    setUserAndStore(null);
    resetAppForAuthChange()
  }, [resetAppForAuthChange, setUserAndStore]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, error, login, register, logout, refreshUser }),
    [error, isLoading, login, logout, refreshUser, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
