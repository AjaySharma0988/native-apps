/**
 * React Native Token Storage
 *
 * Implements the TokenStorage interface from shared-core
 * using @react-native-async-storage/async-storage.
 *
 * This is the RN equivalent of:
 * - Web:      localStorage
 * - Electron: electron-store via IPC
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TokenStorage, AuthUser } from '@chatty/shared-core';
import { makeSafeUser, SAFE_USER_FIELDS } from '@chatty/shared-core';

const TOKEN_KEY = 'chatty_token';
const USER_KEY = 'chatty_user';

export const rnTokenStorage: TokenStorage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async getUser(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  async setUser(user: AuthUser): Promise<void> {
    const safe = makeSafeUser(user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(safe));
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },
};

/** Convenience wrapper */
export const storage = {
  async getToken() { return rnTokenStorage.getToken(); },
  async setToken(t: string) { return rnTokenStorage.setToken(t); },
  async removeToken() { return rnTokenStorage.removeToken(); },
  async getUser() { return rnTokenStorage.getUser(); },
  async setUser(u: AuthUser) { return rnTokenStorage.setUser(u); },
  async removeUser() { return rnTokenStorage.removeUser(); },
};
