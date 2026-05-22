/**
 * @chatty/shared-core — Socket Event Name Constants
 *
 * Single source of truth for ALL socket event names used across:
 * - Web (frontend/src/store/)
 * - Electron (native-apps/desktop-electron/)
 * - React Native (native-apps/mobile-react-native/)
 *
 * Using constants prevents string typo bugs and makes refactoring safe.
 */

// ─── Connection & Presence ─────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Presence
  GET_ONLINE_USERS: "getOnlineUsers",
  RE_REGISTER: "re-register",

  // ─── Chat / Messaging ────────────────────────────────────────────────────
  NEW_MESSAGE: "newMessage",
  MARK_DELIVERED: "mark-delivered",
  MESSAGE_DELIVERED: "messageDelivered",
  MESSAGES_SEEN: "messagesSeen",
  CHAT_DELETED: "chatDeleted",
  MESSAGES_DELETED: "messagesDeleted",
  MESSAGES_DELETED_FOR_EVERYONE: "messagesDeletedForEveryone",
  MESSAGE_EDITED: "messageEdited",
  MESSAGE_REACTED: "messageReacted",

  // ─── Profiles ────────────────────────────────────────────────────────────
  PROFILE_UPDATED: "profileUpdated",
  PROFILE_PHOTO_PRIVACY_UPDATED: "profilePhotoPrivacyUpdated",

  // ─── WebRTC Signaling (1:1 calls) ────────────────────────────────────────
  CALL_USER: "call-user",
  INCOMING_CALL: "incoming-call",
  CALL_ACCEPTED: "call-accepted",
  CALL_ACCEPTED_BY_PEER: "call-accepted-by-peer",
  CALL_REJECTED: "call-rejected",
  CALL_RINGING: "call-ringing",
  END_CALL: "end-call",
  CALL_ENDED: "call-ended",
  CALL_END: "call:end",
  CALL_ENDED_V2: "call:ended",
  CALL_TIMEOUT: "call-timeout",
  CALL_USER_OFFLINE: "call-user-offline",
  CALL_HISTORY_UPDATED: "callHistoryUpdated",

  // ─── ICE Candidates ──────────────────────────────────────────────────────
  ICE_CANDIDATE: "ice-candidate",

  // ─── Call Extras ─────────────────────────────────────────────────────────
  CALL_CONNECTED: "call:connected",
  CALL_PING: "call:ping",
  CALL_PONG: "call:pong",
  CALL_HAND_RAISE: "call:handRaise",
  CALL_EMOJI: "call:emoji",
  CALL_DEVICE_INFO: "call:deviceInfo",
  CALL_MEDIA_STATUS: "call:mediaStatus",
  CALL_RENEGOTIATE: "call:renegotiate",
  CALL_RENEGOTIATE_ANSWER: "call:renegotiate:answer",

  // ─── Group Calls ─────────────────────────────────────────────────────────
  CALL_INCOMING_GROUP: "call:incoming-group",
  CALL_ADD_PARTICIPANTS: "call:addParticipants",
  CALL_GROUP_OFFER: "call:group:offer",
  CALL_GROUP_ANSWER: "call:group:answer",
  CALL_GROUP_ICE: "call:group:ice",
  CALL_GROUP_USER_LEFT: "call:group-user-left",

  // ─── Screen Sharing ───────────────────────────────────────────────────────
  SCREEN_START: "screen:start",
  SCREEN_STOP: "screen:stop",
  SCREEN_OFFER: "screen:offer",
  SCREEN_ANSWER: "screen:answer",
  SCREEN_ICE: "screen:ice",

  // ─── Watch Party ─────────────────────────────────────────────────────────
  WP_START: "wp:start",
  WP_ACTION: "wp:action",
  WP_HEARTBEAT: "wp:heartbeat",
  WP_STOP: "wp:stop",

  // ─── Session Management ───────────────────────────────────────────────────
  SESSION_ADDED: "session:added",
  SESSION_REMOVED: "session:removed",
  SESSION_TERMINATED: "session:terminated",

  // ─── QR Login ────────────────────────────────────────────────────────────
  QR_JOIN: "qr:join",
  QR_AUTH_SUCCESS: "qr:auth:success",
} as const;

export type SocketEventKey = keyof typeof SOCKET_EVENTS;
export type SocketEventValue = typeof SOCKET_EVENTS[SocketEventKey];
