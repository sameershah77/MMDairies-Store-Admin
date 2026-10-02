import type { ApiEnvelope, AuthTokenResponse } from '@/types/api';
import { mapAuthAdminToProfile } from '@/lib/mapStoreAdminProfile';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

const ACCESS_KEY = 'mm_sta_access_token';
const REFRESH_KEY = 'mm_sta_refresh_token';
const PROFILE_KEY = 'mm_sta_profile';
const AUTH_FLAG = 'mm_store_admin_auth';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  scheduleSessionWatch();
}

export function clearAuthStorage() {
  cancelSessionWatch();
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(AUTH_FLAG);
}

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/** AuthProvider subscribes so UI flips to /login when tokens die. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function forceSessionExpired() {
  clearAuthStorage();
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  });
}

export function saveProfileJson(profile: unknown) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfileJson<T>(): T | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/Auth/Refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const body = (await res.json().catch(() => ({}))) as ApiEnvelope<AuthTokenResponse>;
    if (!res.ok || !body.data?.access_token) {
      return false;
    }
    setTokens(body.data.access_token, body.data.refresh_token);
    if (body.data.admin) {
      saveProfileJson(mapAuthAdminToProfile(body.data.admin));
    }
    return true;
  } catch {
    return false;
  }
}

async function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  skipRefresh?: boolean;
};

const REQUEST_TIMEOUT_MS = 15000;

function apiBaseHint() {
  return (
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
    'http://localhost:5046'
  );
}

function unreachableApiMessage(status?: number) {
  const base = apiBaseHint();
  if (status === 502 || status === 503 || status === 504) {
    return `Backend API is not reachable at ${base}. Start (or restart) the M M Dairy API and try again.`;
  }
  return `Unable to reach the backend API at ${base}. Open that URL in the browser once (accept the HTTPS cert), restart the API if needed, then retry.`;
}

async function parseErrorMessage(res: Response): Promise<string> {
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return unreachableApiMessage(res.status);
  }

  const payload = (await res.json().catch(() => ({}))) as ApiEnvelope & {
    title?: string;
    errors?: Record<string, string[]>;
  };

  let message = payload.message || payload.title || `Request failed (${res.status})`;
  if (payload.errors) {
    const first = Object.values(payload.errors).flat()[0];
    if (first) message = first;
  }
  return message;
}

async function fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(
        `Backend API timed out at ${apiBaseHint()}. Stop and restart the API, then try again.`,
        0,
      );
    }
    throw new ApiError(unreachableApiMessage(), 0);
  } finally {
    window.clearTimeout(timer);
  }
}

function buildHeaders(body: unknown, auth: boolean): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function throwSessionExpired(): never {
  forceSessionExpired();
  throw new ApiError('Session expired. Please sign in again.', 401);
}

function decodeJwtExpMs(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded)) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isJwtExpired(token: string): boolean {
  const exp = decodeJwtExpMs(token);
  if (exp == null) return true;
  return Date.now() >= exp;
}

let sessionWatchId = 0;

function cancelSessionWatch() {
  if (sessionWatchId) {
    window.clearTimeout(sessionWatchId);
    sessionWatchId = 0;
  }
}

function scheduleSessionWatch() {
  cancelSessionWatch();
  const token = getAccessToken();
  if (!token) return;
  const exp = decodeJwtExpMs(token);
  if (exp == null) return;
  const delay = Math.max(0, exp - Date.now());
  sessionWatchId = window.setTimeout(() => {
    void (async () => {
      const ok = await refreshOnce();
      if (!ok) forceSessionExpired();
      else scheduleSessionWatch();
    })();
  }, delay);
}

/** Boot / route guard: missing or dead tokens → login. */
export async function hydrateAuthSession(): Promise<boolean> {
  const access = getAccessToken();
  const refresh = getRefreshToken();
  if (!access && !refresh) {
    if (localStorage.getItem(AUTH_FLAG) === 'true') {
      forceSessionExpired();
    }
    return false;
  }
  if (!access || isJwtExpired(access)) {
    const ok = await refreshOnce();
    if (!ok) {
      forceSessionExpired();
      return false;
    }
  }
  scheduleSessionWatch();
  return true;
}

async function requireAuth(options: { skipRefresh?: boolean }) {
  const token = getAccessToken();
  if (!token) throwSessionExpired();
  if (isJwtExpired(token) && !options.skipRefresh) {
    const refreshed = await refreshOnce();
    if (!refreshed) throwSessionExpired();
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, skipRefresh = false } = options;

  if (auth) await requireAuth({ skipRefresh });

  const res = await fetchWithTimeout(path, {
    method,
    headers: buildHeaders(body, auth),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    const message = await parseErrorMessage(res.clone());
    if (/current password is incorrect/i.test(message)) {
      throw new ApiError(message, 401);
    }
    if (!skipRefresh) {
      const refreshed = await refreshOnce();
      if (refreshed) {
        return apiRequest<T>(path, { ...options, skipRefresh: true });
      }
    }
    throwSessionExpired();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res), res.status);
  }

  const payload = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  return (payload.data !== undefined ? payload.data : (payload as unknown as T)) as T;
}

export async function apiRequestMessage(
  path: string,
  options: RequestOptions = {},
): Promise<string> {
  const { method = 'GET', body, auth = true, skipRefresh = false } = options;

  if (auth) await requireAuth({ skipRefresh });

  const res = await fetchWithTimeout(path, {
    method,
    headers: buildHeaders(body, auth),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    const message = await parseErrorMessage(res.clone());
    if (/current password is incorrect/i.test(message)) {
      throw new ApiError(message, 401);
    }
    if (!skipRefresh) {
      const refreshed = await refreshOnce();
      if (refreshed) {
        return apiRequestMessage(path, { ...options, skipRefresh: true });
      }
    }
    throwSessionExpired();
  }

  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res), res.status);
  }

  const payload = (await res.json().catch(() => ({}))) as ApiEnvelope;
  return payload.message || 'OK';
}
