/**
 * React Native Auth Store
 *
 * Uses AsyncStorage for persistence and Bearer token for socket+HTTP auth.
 * Mirrors the web useAuthStore.js structure and Electron useAuthStore.js.
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { createApiClient } from '@chatty/shared-core';
import { storage } from '../utils/tokenStorage';
import type { AuthUser, LinkedDevice } from '@chatty/shared-core';
import { Platform, NativeModules, Alert } from 'react-native';

const getDevHost = (): string => {
  if (Platform.OS === 'ios') {
    return 'localhost';
  }
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match?.[1]) {
      if (match[1] === 'localhost' && Platform.OS === 'android') {
        return '10.0.2.2';
      }
      return match[1];
    }
  }
  return '10.0.2.2';
};

const DEV_HOST = getDevHost();
const API_URL = __DEV__ ? `http://${DEV_HOST}:5001/api` : 'YOUR_PRODUCTION_URL/api';
const SOCKET_URL = __DEV__ ? `http://${DEV_HOST}:5001` : 'YOUR_PRODUCTION_URL';
// NOTE: 10.0.2.2 is Android emulator's alias for host machine localhost

export const apiClient = createApiClient({
  baseURL: API_URL,
  getToken: () => storage.getToken(),
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
  withCredentials: false, // RN cannot use cookies
});

interface AuthState {
  authUser: AuthUser | null;
  isCheckingAuth: boolean;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  isUpdatingProfile: boolean;
  onlineUsers: string[];
  linkedDevices: LinkedDevice[];
  totalActiveSessions: number;
  socket: Socket | null;

  checkAuth: () => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<boolean>;
  signup: (data: { fullName: string; email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
  fetchLinkedDevices: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isLoggingIn: false,
  isSigningUp: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  linkedDevices: [],
  totalActiveSessions: 0,
  socket: null,

  checkAuth: async () => {
    // Load from AsyncStorage first for instant UI
    const cachedUser = await storage.getUser();
    if (cachedUser) set({ authUser: cachedUser });

    try {
      const res = await apiClient.get('/auth/check');
      const user = res.data as AuthUser;
      set({ authUser: user });
      await storage.setUser(user);
      if (user.token) await storage.setToken(user.token);
      get().connectSocket();
    } catch (error: any) {
      if (error.response?.status === 401) {
        set({ authUser: null });
        await storage.removeUser();
        await storage.removeToken();
      } else if (cachedUser) {
        get().connectSocket();
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await apiClient.post('/auth/login', data);
      const user = res.data as AuthUser;
      if (user.token) await storage.setToken(user.token);
      await storage.setUser(user);
      set({ authUser: user });
      get().connectSocket();
      return true;
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Login failed. Please check your network and credentials.';
      Alert.alert('Login Failed', errMsg);
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await apiClient.post('/auth/signup', data);
      const user = res.data as AuthUser;
      if (user.token) await storage.setToken(user.token);
      await storage.setUser(user);
      set({ authUser: user });
      get().connectSocket();
      return true;
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Signup failed. Please try again.';
      Alert.alert('Signup Failed', errMsg);
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try { await apiClient.post('/auth/logout'); } catch {}
    set({ authUser: null });
    await storage.removeUser();
    await storage.removeToken();
    get().disconnectSocket();
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await apiClient.put('/auth/update-profile', data);
      set({ authUser: res.data });
      await storage.setUser(res.data);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  fetchLinkedDevices: async () => {
    try {
      const res = await apiClient.get('/auth/linked-devices');
      set({ linkedDevices: res.data.sessions, totalActiveSessions: res.data.totalActive });
    } catch {}
  },

  connectSocket: async () => {
    const { authUser, socket } = get();
    if (!authUser || socket) return;

    const token = await storage.getToken();

    const newSocket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      query: { userId: authUser._id },
      withCredentials: false, // RN cannot use cookies
      transports: ['websocket'],
    });

    newSocket.connect();
    set({ socket: newSocket });

    newSocket.on('connect', () => console.log('[RN Socket] Connected:', newSocket.id));
    newSocket.on('connect_error', (err) => console.error('[RN Socket] Error:', err.message));
    newSocket.on('getOnlineUsers', (userIds: string[]) => set({ onlineUsers: userIds }));

    // ── Call events ────────────────────────────────────────────────────
    newSocket.on('incoming-call', (data) => {
      import('./useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().handleIncomingCall(data);
      });
    });

    newSocket.on('call-accepted-by-peer', (data) => {
      import('./useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().handleCallAcceptedByPeer(data);
      });
    });

    newSocket.on('ice-candidate', (data) => {
      import('./useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().handleIceCandidate(data);
      });
    });

    newSocket.on('call-ended', () => {
      import('./useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().handleCallEnded();
      });
    });

    newSocket.on('call:ended', ({ reason }: { reason: string }) => {
      import('./useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().handleCallEnded({ reason });
      });
    });

    newSocket.on('call-rejected', () => {
      import('./useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().handleCallRejected();
      });
    });

    newSocket.on('call-timeout', () => {
      import('./useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().handleCallTimeout();
      });
    });

    newSocket.on('call-user-offline', () => {
      import('./useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().handleUserOffline();
      });
    });

    // ── Session events ─────────────────────────────────────────────────
    newSocket.on('session:terminated', ({ message }: { message: string }) => {
      set({ authUser: null });
      storage.removeUser();
      storage.removeToken();
      get().disconnectSocket();
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) socket.disconnect();
    set({ socket: null });
  },
}));
