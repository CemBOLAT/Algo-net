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

async function refreshAccessToken(signal) {
  const { refreshToken } = getTokens();
  if (!refreshToken || isTokenExpired(refreshToken, 0)) {
    throw new Error('refresh_missing_or_expired');
  }
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    signal,
  });
  if (!res.ok) throw new Error('refresh_failed');
  const data = await res.json();
  if (!data?.accessToken) throw new Error('refresh_response_invalid');
  setTokens({ accessToken: data.accessToken, refreshToken });
  return data.accessToken;
}

export async function ensureAccessToken(signal) {
  let { accessToken } = getTokens();
  if (!accessToken || isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken(signal);
  }
  return accessToken;
}