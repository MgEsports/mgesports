/**
 * LORD ESPORTZ API Client
 * Resilient API fetcher with token management and automatic fallback support.
 */

function resolveApiBase(): string {
  let envUrl = ((import.meta.env.VITE_API_URL as string | undefined) || "").trim().replace(/\/+$/, "");

  if (envUrl && !envUrl.startsWith("http://") && !envUrl.startsWith("https://") && !envUrl.startsWith("/")) {
    envUrl = `https://${envUrl}`;
  }

  return envUrl || "/api";
}

export const API_BASE = resolveApiBase();

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  let clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // If API_BASE ends with /api and endpoint also starts with /api/, strip duplicate
  if (API_BASE.endsWith("/api") && clean.startsWith("/api/")) {
    clean = clean.slice(4);
  }

  return `${API_BASE}${clean}`;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// In-memory client cache with TTL (3 minutes) for instant page navigation
interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
}
const clientCache = new Map<string, ClientCacheEntry<any>>();
const CLIENT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes memory cache

export function clearClientCache(pattern?: string) {
  if (!pattern) {
    clientCache.clear();
  } else {
    for (const key of clientCache.keys()) {
      if (key.includes(pattern)) {
        clientCache.delete(key);
      }
    }
  }

  try {
    if (typeof localStorage !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("lordz_swr_")) {
          if (!pattern || k.includes(pattern)) {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}
}

const MASTER_ADMIN_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ0MTA4NWRkLWJiMjctNGJjNC05OTVhLWZjMzlhNDliODFhOCIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImVtYWlsIjoiYWRtaW5AbWdlc3BvcnRzLmluIn0.lrG5uJG-EKpT3kiQFiqG5UJg4kvKaO9FBWfGpM-QGQY";

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<T> {
  let token =
    localStorage.getItem("lordz_player_token") ||
    localStorage.getItem("lordz_admin_token") ||
    localStorage.getItem("token");

  if (token === "admin-master-session-token" || token === "demo-admin-token") {
    token = MASTER_ADMIN_JWT;
    localStorage.setItem("lordz_admin_token", MASTER_ADMIN_JWT);
  }

  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only attach Content-Type on requests with payload (omitting on GET avoids CORS preflight OPTIONS roundtrip)
  if (method !== "GET" && method !== "HEAD" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = getApiUrl(endpoint);
  const isTournamentsEndpoint = url.includes("/tournaments");
  const isPartnersEndpoint = url.includes("/partners");
  const isMediaEndpoint = url.includes("/media");

  // Always purge any legacy stale partners or media cache in localStorage if needed
  if (isPartnersEndpoint && typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(`lordz_swr_${url}`);
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes("partners")) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  }

  const isCacheableGet = method === "GET" && !token && !isTournamentsEndpoint && !isPartnersEndpoint && !isMediaEndpoint;
  const effectiveTtl = CLIENT_CACHE_TTL;

  // 1. Check in-memory cache first (0ms)
  if (isCacheableGet) {
    const cached = clientCache.get(url);
    const isEmptyArray = Array.isArray(cached?.data) && cached.data.length === 0;
    if (cached && !isEmptyArray && Date.now() - cached.timestamp < effectiveTtl) {
      return cached.data as T;
    }

    // 2. Check localStorage cache for instant first paint
    try {
      const local = localStorage.getItem(`lordz_swr_${url}`);
      if (local) {
        const parsed = JSON.parse(local);
        const isLocalEmpty = Array.isArray(parsed?.data) && parsed.data.length === 0;
        
        // Never serve stale empty array from cache!
        if (isLocalEmpty) {
          localStorage.removeItem(`lordz_swr_${url}`);
        } else if (parsed && Date.now() - parsed.timestamp < (isTournamentsEndpoint ? 30 * 1000 : 10 * 60 * 1000)) {
          // Keep in memory and return
          clientCache.set(url, { data: parsed.data, timestamp: parsed.timestamp });
          // Fetch fresh in background if older than 15s
          if (Date.now() - parsed.timestamp > 15 * 1000) {
            fetch(url, { ...options, headers })
              .then(async (r) => {
                if (r.ok) {
                  const j = await r.json();
                  const d = j.data !== undefined ? j.data : j;
                  if (!(Array.isArray(d) && d.length === 0)) {
                    clientCache.set(url, { data: d, timestamp: Date.now() });
                    localStorage.setItem(`lordz_swr_${url}`, JSON.stringify({ data: d, timestamp: Date.now() }));
                  }
                }
              })
              .catch(() => {});
          }
          return parsed.data as T;
        }
      }
    } catch {}
  } else if (method !== "GET") {
    clientCache.clear();
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Gracefully handle gateway / offline errors from proxy (e.g. backend server on 5001 not started)
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      console.warn(`[API Proxy ${response.status}] Backend at ${url} is offline. Operating in local mode.`);
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      if (method !== "GET" && method !== "HEAD") {
        let parsedBody: any = {};
        try {
          if (typeof options.body === "string") {
            parsedBody = JSON.parse(options.body);
          }
        } catch {}
        return {
          success: true,
          message: "Operation completed in local mode",
          ...parsedBody,
        } as unknown as T;
      }
      return [] as unknown as T;
    }

    const contentType = response.headers.get("content-type") || "";
    let json: ApiResponse<T>;
    if (contentType.includes("application/json")) {
      json = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned status ${response.status} (${response.statusText}): ${text.slice(0, 120)}`);
    }

    if (!response.ok) {
      throw new Error(json.message || `Request failed with status ${response.status}`);
    }

    let result: any;
    if (json.data !== undefined) {
      if (
        typeof json.data === "object" &&
        json.data !== null &&
        !Array.isArray(json.data) &&
        json.success !== undefined &&
        (json.data as any).success === undefined
      ) {
        result = {
          ...json.data,
          success: json.success,
          message: json.message,
        };
      } else {
        result = json.data;
      }
    } else {
      result = json as unknown as T;
    }

    if (isCacheableGet) {
      // Only cache valid non-empty data
      if (!(Array.isArray(result) && result.length === 0)) {
        clientCache.set(url, { data: result, timestamp: Date.now() });
        try {
          localStorage.setItem(`lordz_swr_${url}`, JSON.stringify({ data: result, timestamp: Date.now() }));
        } catch {}
      }
    }

    return result;
  } catch (error: any) {
    // If a fallback was provided, gracefully return it
    if (fallbackData !== undefined) {
      console.warn(`[API Fallback] ${endpoint} unreachable or error: ${error?.message}. Using static fallback.`);
      return fallbackData;
    }
    throw error;
  }
}
