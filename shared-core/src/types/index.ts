/**
 * @chatty/shared-core — Shared TypeScript interfaces
 *
 * These types mirror the MongoDB models in the backend.
 * Keep in sync with: backend/src/models/
 */

// ─── User ─────────────────────────────────────────────────────────────────────

export interface PrivacySettings {
  profilePhotoVisibility: "everyone" | "nobody" | "custom";
  allowedUsers: string[];
}

export interface NotificationSettings {
  popupsEnabled: boolean;
  soundEnabled: boolean;
  soundType: "default" | "custom" | "mute";
  customSoundUrl?: string;
}

export interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
  about?: string;
  privacy?: PrivacySettings;
  notificationSettings?: NotificationSettings;
  deletionScheduledAt?: string | null;
  sessionId?: string;
  /** JWT token returned in body — used by Electron/RN for Bearer auth */
  token?: string;
}

// ─── Message ───────────────────────────────────────────────────────────────────

export type MessageStatus = "pending" | "sent" | "delivered" | "seen" | "failed";
export type MessageType = "text" | "image" | "audio" | "video" | "call" | "status_reply";
export type CallStatus = "missed" | "completed" | "rejected" | "answered";
export type CallType = "audio" | "video";

export interface MessageReaction {
  emoji: string;
  userId: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  audio?: string;
  video?: string;
  type: MessageType;
  status: MessageStatus;
  reactions?: MessageReaction[];
  isEdited?: boolean;
  isDeletedForEveryone?: boolean;
  statusRef?: string | null;
  /** For call messages */
  callType?: CallType;
  callStatus?: CallStatus;
  callDuration?: number;
  createdAt: string;
  updatedAt?: string;
}

// ─── Chat List User ─────────────────────────────────────────────────────────

export interface ChatUser extends AuthUser {
  lastMessage?: Message | null;
  unreadCount?: number;
  isOnline?: boolean;
}

// ─── Call ──────────────────────────────────────────────────────────────────────

export interface CallerInfo {
  _id: string;
  fullName: string;
  profilePic: string;
}

export interface IncomingCall {
  from: string;
  offer: RTCSessionDescriptionInit;
  callType: CallType;
  callerInfo: CallerInfo;
  isGroupCall?: boolean;
  callId?: string;
}

export interface OutgoingCall {
  to: ChatUser;
  callType: CallType;
}

export interface ActiveCall {
  with: string;
  callType: CallType;
  callerInfo: CallerInfo;
}

export interface EndedCall {
  peerInfo: CallerInfo;
  callType: CallType;
}

// ─── Linked Device / Session ────────────────────────────────────────────────

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface LinkedDevice {
  sessionId: string;
  deviceName: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  isActive: boolean;
}

// ─── Status ────────────────────────────────────────────────────────────────────

export interface StatusItem {
  _id: string;
  userId: string;
  type: "text" | "image" | "video";
  content: string;
  caption?: string;
  expiresAt: string;
  viewers: string[];
  createdAt: string;
}

// ─── Socket Event Payloads ─────────────────────────────────────────────────────

export interface SocketCallUserPayload {
  to: string;
  offer: RTCSessionDescriptionInit;
  callType: CallType;
  callerInfo: CallerInfo;
}

export interface SocketCallAcceptedPayload {
  to: string;
  answer: RTCSessionDescriptionInit;
}

export interface SocketIceCandidatePayload {
  to: string;
  candidate: RTCIceCandidateInit | null;
}

// ─── Platform Token Storage (abstract) ────────────────────────────────────────

export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
  getUser(): Promise<AuthUser | null>;
  setUser(user: AuthUser): Promise<void>;
  removeUser(): Promise<void>;
}

// ─── ICE Config ───────────────────────────────────────────────────────────────

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RTCConfig {
  iceServers: IceServerConfig[];
  iceTransportPolicy: "all" | "relay";
  bundlePolicy: "max-bundle" | "balanced" | "max-compat";
  rtcpMuxPolicy: "require" | "negotiate";
  iceCandidatePoolSize: number;
}
