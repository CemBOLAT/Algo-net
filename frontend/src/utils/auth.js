// Simple JWT and token storage helpers

const STORAGE_KEYS = {
  access: 'accessToken',
  refresh: 'refreshToken',
};

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.access, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
}

export function getTokens() {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.access) || '',
    refreshToken: localStorage.getItem(STORAGE_KEYS.refresh) || '',
  };
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.access);
  localStorage.removeItem(STORAGE_KEYS.refresh);
}

export function decodeJwt(token) {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function isTokenExpired(token, skewSec = 30) {
  const claims = decodeJwt(token);
  if (!claims || !claims.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= (claims.exp - skewSec);
}

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken || isTokenExpired(refreshToken, 0)) {
    throw new Error('refresh_missing_or_expired');
  }
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!res.ok) throw new Error('refresh_failed');
  const data = await res.json();
  if (!data?.accessToken) throw new Error('refresh_response_invalid');
  setTokens({ accessToken: data.accessToken, refreshToken });
  return data.accessToken;
}

export async function ensureAccessToken() {
  let { accessToken } = getTokens();
  if (!accessToken || isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken();
  }
  return accessToken;
}

export async function authorizedFetch(input, init = {}) {
  try {
    const token = await ensureAccessToken();
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    let res = await fetch(input, { ...init, headers });
    if (res.status === 401) {
      // try refresh once
      const newToken = await refreshAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(input, { ...init, headers });
    }
    if (res.status === 401) throw new Error('unauthorized');
    return res;
  } catch (e) {
    // On any auth failure, clear and redirect to login
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
    throw e;
  }
}
