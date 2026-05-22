/**
 * @chatty/shared-core — Platform-agnostic Axios Factory
 *
 * Usage:
 *   const api = createApiClient({
 *     baseURL: 'http://localhost:5001/api',
 *     getToken: () => AsyncStorage.getItem('chatty_token'),
 *     onUnauthorized: () => { clear store; navigate to login },
 *   });
 *
 * Design:
 * - Web uses cookies (withCredentials). No getToken needed.
 * - Electron/RN uses Bearer token in Authorization header.
 * - The 401 interceptor calls onUnauthorized so each platform
 *   can handle redirect/navigation in its own way.
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

export interface ApiClientOptions {
  /** API base URL, e.g. http://localhost:5001/api */
  baseURL: string;
  /**
   * Async function returning the JWT token (for Bearer auth).
   * If null/undefined → no Authorization header added.
   * Set to undefined for web (cookie-based).
   */
  getToken?: () => Promise<string | null>;
  /**
   * Called when backend returns 401.
   * Use to clear auth state and redirect to login.
   */
  onUnauthorized?: () => void;
  /**
   * If true, sets withCredentials (for cookie-based auth on web/Electron).
   * Default: false (RN can't use cookies)
   */
  withCredentials?: boolean;
}

/**
 * Creates a configured axios instance for any Chatty platform.
 */
export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const {
    baseURL,
    getToken,
    onUnauthorized,
    withCredentials = false,
  } = options;

  const instance = axios.create({
    baseURL,
    withCredentials,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // ── Request Interceptor: inject Bearer token ─────────────────────────────
  if (getToken) {
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // ── Response Interceptor: handle 401 globally ────────────────────────────
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        if (onUnauthorized) {
          onUnauthorized();
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
