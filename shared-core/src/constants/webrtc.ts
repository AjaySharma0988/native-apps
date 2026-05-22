/**
 * @chatty/shared-core — WebRTC / ICE Configuration
 *
 * Platform-agnostic ICE server config used by:
 * - Electron (Chromium RTCPeerConnection)
 * - React Native (react-native-webrtc RTCPeerConnection)
 *
 * Mirrors: frontend/src/constants/webrtc.js
 * Changes here should be reflected there too (and vice versa).
 */

import type { RTCConfig } from "../types/index";

// ── Static STUN servers (always needed, no auth required) ──────────────────
const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

// ── Static fallback TURN (free — 60s session cap; use own coturn in prod) ──
const STATIC_TURN_FALLBACK = [
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:80?transport=tcp",
      "turns:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: [
      "turn:a.relay.metered.ca:80",
      "turn:a.relay.metered.ca:80?transport=tcp",
      "turns:a.relay.metered.ca:443?transport=tcp",
    ],
    username: "e8dd65f5654e3c3a3a2b7f83",
    credential: "uU2OoFQBwcuW0xV7",
  },
];

/**
 * Main ICE config — use this for all RTCPeerConnection instantiations.
 * Compatible with both Chromium WebRTC (Electron) and react-native-webrtc.
 */
export const ICE_SERVERS: RTCConfig = {
  iceServers: [...STUN_SERVERS, ...STATIC_TURN_FALLBACK],
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceCandidatePoolSize: 2,
};

/**
 * TURN-only config — useful for debugging.
 * If calls work with this but fail with ICE_SERVERS, your TURN server is broken.
 */
export const ICE_SERVERS_RELAY_ONLY: RTCConfig = {
  ...ICE_SERVERS,
  iceTransportPolicy: "relay",
};

/**
 * Fetch fresh ICE config.
 *
 * In the future this can hit the backend for HMAC-signed dynamic TURN credentials.
 * For now returns the static config (same as web app fallback).
 *
 * @param tokenGetter - platform-specific function to get auth token
 * @param baseURL - backend API base URL
 */
export const fetchIceServers = async (
  _tokenGetter?: () => Promise<string | null>,
  _baseURL?: string
): Promise<RTCConfig> => {
  // TODO: fetch from backend /api/auth/turn-credentials when dynamic TURN is configured
  return ICE_SERVERS;
};
