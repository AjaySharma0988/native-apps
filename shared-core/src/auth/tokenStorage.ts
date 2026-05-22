/**
 * @chatty/shared-core — Abstract Token Storage Interface
 *
 * Each platform implements this interface with its native storage:
 * - Electron:      electron-store (main process) via IPC
 * - React Native:  @react-native-async-storage/async-storage
 * - Web (unused):  localStorage (web uses cookies)
 *
 * Import the interface here; each platform provides its own implementation.
 */

import type { AuthUser, TokenStorage } from "../types/index";
import { SAFE_USER_FIELDS } from "../constants/api";

export type { TokenStorage };

/**
 * Creates a safe user object for persistence — strips sensitive backend fields.
 * Mirrors the web app's persistUser() function in useAuthStore.js.
 */
export function makeSafeUser(user: AuthUser): Partial<AuthUser> {
  const safe: Partial<AuthUser> = {};
  for (const key of SAFE_USER_FIELDS) {
    const k = key as keyof AuthUser;
    if (user[k] !== undefined) {
      (safe as any)[k] = user[k];
    }
  }
  return safe;
}

/**
 * In-memory token storage implementation.
 * Useful for testing or environments without persistent storage.
 */
export class MemoryTokenStorage implements TokenStorage {
  private token: string | null = null;
  private user: AuthUser | null = null;

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
  }

  async removeToken(): Promise<void> {
    this.token = null;
  }

  async getUser(): Promise<AuthUser | null> {
    return this.user;
  }

  async setUser(user: AuthUser): Promise<void> {
    this.user = user;
  }

  async removeUser(): Promise<void> {
    this.user = null;
  }
}
