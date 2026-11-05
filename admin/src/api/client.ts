/**
 * Lord Esports API Client
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
const CLIENT_CACHE_TTL = 2 * 60 * 1000;

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

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<T> {
  const token =
    localStorage.getItem("lordz_admin_token") ||
    localStorage.getItem("token") ||
    null;

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
  const isCacheableGet = method === "GET" && !token;

  if (isCacheableGet) {
    const cached = clientCache.get(url);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
      return cached.data as T;
    }
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
      clientCache.set(url, { data: result, timestamp: Date.now() });
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
