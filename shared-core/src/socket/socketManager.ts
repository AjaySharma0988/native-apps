/**
 * @chatty/shared-core — Cross-Platform Socket Manager
 *
 * Manages a single socket.io-client instance.
 * Uses token-based auth (handshake.auth.token) — supported by backend
 * socket middleware as a fallback to httpOnly cookies.
 *
 * Usage:
 *   const manager = createSocketManager({
 *     serverURL: 'http://localhost:5001',
 *     getToken: () => AsyncStorage.getItem('chatty_token'),
 *     userId: authUser._id,
 *   });
 *   manager.connect();
 *   manager.on(SOCKET_EVENTS.NEW_MESSAGE, handler);
 *   manager.disconnect();
 */

import { io, Socket } from "socket.io-client";

export interface SocketManagerOptions {
  /** Backend WebSocket server URL (no /api suffix) */
  serverURL: string;
  /**
   * Async function returning the JWT token for socket handshake auth.
   * The backend reads this as socket.handshake.auth.token.
   */
  getToken: () => Promise<string | null>;
  /** User ID — sent as query param for backward-compat */
  userId: string;
  /** Called when socket connects */
  onConnect?: () => void;
  /** Called when socket disconnects */
  onDisconnect?: (reason: string) => void;
  /** Called on connection error */
  onConnectError?: (err: Error) => void;
}

export class SocketManager {
  private socket: Socket | null = null;
  private options: SocketManagerOptions;

  constructor(options: SocketManagerOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;
    if (this.socket) {
      // Stale socket — destroy and recreate
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const token = await this.options.getToken();

    this.socket = io(this.options.serverURL, {
      // ── Auth: token in handshake (backend socket.js line 50-52 fallback) ──
      auth: token ? { token } : {},
      // ── Query: userId for backward-compat with older listeners ────────────
      query: { userId: this.options.userId },
      // ── Cookie-based auth not needed — token covers it ────────────────────
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.connect();

    this.socket.on("connect", () => {
      console.log("[SocketManager] Connected:", this.socket?.id);
      this.options.onConnect?.();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketManager] Disconnected:", reason);
      this.options.onDisconnect?.(reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[SocketManager] Connection error:", err.message);
      this.options.onConnectError?.(err);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void): void {
    if (handler) {
      this.socket?.off(event, handler);
    } else {
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn("[SocketManager] Cannot emit — socket not connected:", event);
      return;
    }
    this.socket.emit(event, data);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }

  /** Update the token (e.g. after token refresh) and reconnect */
  async updateToken(): Promise<void> {
    if (this.socket) {
      this.disconnect();
      await this.connect();
    }
  }
}

/**
 * Factory function — creates a SocketManager.
 * Preferred over direct class instantiation for testing/mocking.
 */
export function createSocketManager(options: SocketManagerOptions): SocketManager {
  return new SocketManager(options);
}
