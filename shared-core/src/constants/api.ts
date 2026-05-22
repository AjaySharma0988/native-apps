/**
 * @chatty/shared-core — API Endpoint Constants
 *
 * Centralizes all API paths so platforms never hard-code strings.
 * Platform-specific clients set the BASE_URL themselves.
 */

// ─── Default base URLs ──────────────────────────────────────────────────────

/** Used by Electron renderer (dev) and RN (dev) */
export const DEV_API_BASE_URL = "http://localhost:5001/api";

/** Used in production — Electron should override with actual deployed URL */
export const PROD_API_BASE_URL = "/api";

// ─── Auth Routes ────────────────────────────────────────────────────────────

export const AUTH_ROUTES = {
  CHECK: "/auth/check",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  LOGOUT: "/auth/logout",
  UPDATE_PROFILE: "/auth/update-profile",
  PRIVACY: "/auth/privacy",
  NOTIFICATIONS: "/auth/notifications",
  DELETE_ACCOUNT: "/auth/delete-account",
  RESTORE_ACCOUNT: "/auth/restore-account",
  LINKED_DEVICES: "/auth/linked-devices",
  FCM_TOKEN: "/auth/fcm-token",
} as const;

// ─── Message Routes ─────────────────────────────────────────────────────────

export const MESSAGE_ROUTES = {
  USERS: "/messages/users",
  GET_MESSAGES: (userId: string) => `/messages/${userId}`,
  SEND_MESSAGE: (userId: string) => `/messages/send/${userId}`,
  MARK_READ: (userId: string) => `/messages/mark-read/${userId}`,
  DELETE_CHAT: (userId: string) => `/messages/${userId}`,
  BULK_DELETE: "/messages/bulk",
  UPDATE_MESSAGE: (messageId: string) => `/messages/${messageId}`,
  REACT: (messageId: string) => `/messages/${messageId}/react`,
} as const;

// ─── Call Routes ─────────────────────────────────────────────────────────────

export const CALL_ROUTES = {
  HISTORY: "/calls",
  CLEAR: "/calls",
} as const;

// ─── Status Routes ────────────────────────────────────────────────────────────

export const STATUS_ROUTES = {
  GET: "/status",
  CREATE: "/status",
  DELETE: (id: string) => `/status/${id}`,
  VIEW: (id: string) => `/status/${id}/view`,
} as const;

// ─── Safe user fields (match frontend SAFE_USER_FIELDS) ───────────────────

export const SAFE_USER_FIELDS = [
  "_id",
  "fullName",
  "email",
  "profilePic",
  "about",
  "privacy",
  "deletionScheduledAt",
  "notificationSettings",
] as const;
