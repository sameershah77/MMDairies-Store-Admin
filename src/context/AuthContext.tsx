import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { logoutApi, signInStoreAdmin } from '@/api/auth';
import { getMyProfile } from '@/api/profile';
import { getAllStores } from '@/api/stores';
import {
  ApiError,
  clearAuthStorage,
  getAccessToken,
  hydrateAuthSession,
  loadProfileJson,
  onSessionExpired,
  saveProfileJson,
} from '@/lib/apiClient';
import { mapMyProfileDto } from '@/lib/mapStoreAdminProfile';
import { profile as defaultProfile } from '@/data/mockData';
import type { StoreAdminProfile } from '@/types';
import type { StoreListItemDto } from '@/types/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  profile: StoreAdminProfile;
  hasPermission: (permissionId: number) => boolean;
  login: (loginValue: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  applyProfile: (next: StoreAdminProfile) => void;
  refreshProfile: () => Promise<{ mustRelogin: boolean }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadStoresSafe(): Promise<StoreListItemDto[]> {
  try {
    return await getAllStores();
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getAccessToken();
    if (!token) {
      if (localStorage.getItem('mm_store_admin_auth') === 'true') clearAuthStorage();
      return false;
    }
    return true;
  });
  const [profile, setProfile] = useState<StoreAdminProfile>(() => {
    const loaded = loadProfileJson<Partial<StoreAdminProfile> & StoreAdminProfile>();
    if (!loaded) return defaultProfile;
    return {
      ...defaultProfile,
      ...loaded,
      firstName: loaded.firstName ?? '',
      lastName: loaded.lastName ?? '',
      assignedStores: loaded.assignedStores ?? [],
      contactPhones: loaded.contactPhones ?? [],
      contactEmails: loaded.contactEmails ?? [],
      permissionIds: loaded.permissionIds ?? [],
    };
  });

  useEffect(() => {
    void hydrateAuthSession().then((ok) => {
      if (!ok) {
        setIsAuthenticated(false);
        setProfile(defaultProfile);
      }
    });
    return onSessionExpired(() => {
      setIsAuthenticated(false);
      setProfile(defaultProfile);
    });
  }, []);

  const applyProfile = useCallback((next: StoreAdminProfile) => {
    setProfile(next);
    saveProfileJson(next);
  }, []);

  const login = useCallback(
    async (loginValue: string, password: string) => {
      const value = loginValue.trim();
      if (!value || value.length < 3) {
        return { ok: false, error: 'Enter a valid phone number or username' };
      }
      if (!password) {
        return { ok: false, error: 'Password is required' };
      }

      try {
        const { profile: nextProfile } = await signInStoreAdmin(value, password);
        applyProfile(nextProfile);
        setIsAuthenticated(true);
        return { ok: true };
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Unable to sign in. Is the API running?';
        return { ok: false, error: message };
      }
    },
    [applyProfile],
  );

  const logout = useCallback(async () => {
    await logoutApi();
    setIsAuthenticated(false);
    setProfile(defaultProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    const dto = await getMyProfile();
    if (dto.must_relogin) return { mustRelogin: true };
    const stores = await loadStoresSafe();
    applyProfile(mapMyProfileDto(dto, stores));
    return { mustRelogin: false };
  }, [applyProfile]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const result = await refreshProfile();
        if (result.mustRelogin) await logout();
      } catch {
        // keep cached profile if GetMyProfile fails
      }
    })();
  }, [isAuthenticated, logout, refreshProfile]);

  const hasPermission = useCallback(
    (permissionId: number) => profile.permissionIds.includes(permissionId),
    [profile.permissionIds],
  );

  const value = useMemo(
    () => ({ isAuthenticated, profile, hasPermission, login, logout, applyProfile, refreshProfile }),
    [isAuthenticated, profile, hasPermission, login, logout, applyProfile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
