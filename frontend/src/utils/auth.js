// Simple JWT and token storage helpers
/*
 Token lifetimes (server contract):
 - access token: 15 minutes
 - refresh token: 1 day
 ensureAccessToken() refreshes the access token when expired using /api/auth/refresh.
*/

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

const DEFAULT_API_BASE = import.meta?.env?.VITE_API_BASE || '';

// Deduplicate parallel refresh calls
let refreshInFlight = null;

async function refreshAccessToken(signal) {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
        const { refreshToken } = getTokens();
        if (!refreshToken || isTokenExpired(refreshToken, 0)) {
            throw new Error('refresh_missing_or_expired');
        }
        const res = await fetch(`${DEFAULT_API_BASE}/api/auth/refresh`, {
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
    })();
    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

export async function ensureAccessToken(signal) {
    let { accessToken } = getTokens();
    if (!accessToken || isTokenExpired(accessToken)) {
        accessToken = await refreshAccessToken(signal);
    }
    return accessToken;
}

// Helper: fetch with auth, retry once on 401 after a refresh
export async function fetchWithAuth(input, init = {}, apiBase = DEFAULT_API_BASE) {
    const signal = init.signal;
    let accessToken = await ensureAccessToken(signal);

    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${accessToken}`);

    const url =
        typeof input === 'string' && !/^https?:\/\//i.test(input)
            ? `${apiBase}${input}`
            : input;

    const doFetch = () => fetch(url, { ...init, headers });

    let res = await doFetch();
    if (res.status === 401) {
        try {
            accessToken = await refreshAccessToken(signal);
            headers.set('Authorization', `Bearer ${accessToken}`);
            res = await doFetch();
        } catch {
            clearTokens();
            throw new Error('unauthorized');
        }
    }
    return res;
}

function buildUrl(input, apiBase = DEFAULT_API_BASE) {
    return typeof input === 'string' && !/^https?:\/\//i.test(input) ? `${apiBase}${input}` : input;
}

async function parseResponse(res) {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

// Axios-like helper
export const http = {
    async request(input, opts = {}) {
        const {
            method = 'GET',
            headers,
            body,
            json = true,
            auth = true,
            signal,
            apiBase = DEFAULT_API_BASE,
        } = opts;

        const url = buildUrl(input, apiBase);
        const init = { method, signal };
        const h = new Headers(headers || {});
        if (json && body !== undefined && body !== null) {
            if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
            init.body = typeof body === 'string' ? body : JSON.stringify(body);
        } else if (body !== undefined) {
            init.body = body;
        }
        init.headers = h;

        const res = auth ? await fetchWithAuth(url, init, apiBase) : await fetch(url, init);
        if (!res.ok) {
            const errBody = await parseResponse(res);
            const err = new Error((errBody && errBody.message) || `request_failed_${res.status}`);
            err.status = res.status;
            err.data = errBody;
            throw err;
        }
        return await parseResponse(res);
    },
    get(url, opts) {
        return this.request(url, { ...(opts || {}), method: 'GET' });
    },
    post(url, body, opts) {
        return this.request(url, { ...(opts || {}), method: 'POST', body });
    },
    put(url, body, opts) {
        return this.request(url, { ...(opts || {}), method: 'PUT', body });
    },
    delete(url, opts) {
        return this.request(url, { ...(opts || {}), method: 'DELETE' });
    },
};

// Optional: factory to bind a base for a specific microservice
export function createHttp(apiBase) {
    return {
        request(input, opts) {
            return http.request(input, { ...(opts || {}), apiBase });
        },
        get(url, opts) {
            return http.get(url, { ...(opts || {}), apiBase });
        },
        post(url, body, opts) {
            return http.post(url, body, { ...(opts || {}), apiBase });
        },
        put(url, body, opts) {
            return http.put(url, body, { ...(opts || {}), apiBase });
        },
        delete(url, opts) {
            return http.delete(url, { ...(opts || {}), apiBase });
        },
    };
}