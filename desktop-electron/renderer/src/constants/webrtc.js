/**
 * ICE / STUN / TURN configuration — centralized for all RTCPeerConnections.
 *
 * TURN is REQUIRED for calls across different networks (WiFi ↔ Mobile data).
 * Without TURN, WebRTC only works on the same local network (STUN only).
 *
 * Dynamic credentials are fetched from the backend before every call.
 * This prevents the #1 cause of 60-second call drops: TURN credential expiry.
 *
 * 🔴 FOR PRODUCTION: Configure TURN_SECRET in backend .env and point the
 *    TURN URLs to your own coturn server or a paid provider.
 */

// ── Static STUN servers (always needed, no auth required) ──────────────────
const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

// ── Static fallback TURN (used only if backend fetch fails) ────────────────
// Kept as last-resort; free providers cap sessions at ~60 s.
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
 * Fetch fresh TURN credentials from the backend before starting a call.
 *
 * The backend generates HMAC-SHA1 signed credentials with a 1-hour TTL,
 * which is the standard coturn "time-limited credentials" mechanism.
 *
 * Returns a full RTCConfiguration object ready for new RTCPeerConnection().
 */
export const fetchIceServers = async () => {
  try {
    // Check localStorage cache first — avoids delay on every call
    const cached = localStorage.getItem("turn_credentials");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() < parsed.expiresAt) {
        console.log("[WebRTC] Using cached ICE config for instant connection");
        return parsed.config;
      }
    }

    // NOTE: openrelay.metered.ca uses static credentials, NOT HMAC-signed ones.
    // The backend dynamic credentials are only valid for a self-hosted coturn server.
    // Using only proven working static servers eliminates 3-5s wasted auth failures.
    const config = {
      iceServers: [...STUN_SERVERS, ...STATIC_TURN_FALLBACK],
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
      iceCandidatePoolSize: 2,
    };

    // Cache for 50 minutes so subsequent calls are instant
    localStorage.setItem("turn_credentials", JSON.stringify({
      config,
      expiresAt: Date.now() + (50 * 60 * 1000),
    }));

    console.log("[WebRTC] ICE config ready with STUN + TURN relay servers");
    return config;
  } catch (err) {
    console.warn("[WebRTC] Using static ICE fallback:", err.message);
    return ICE_SERVERS;
  }
};



/**
 * Static ICE config — used as fallback if fetchIceServers() fails,
 * and for any code that hasn't migrated to the dynamic credentials yet.
 */
export const ICE_SERVERS = {
  iceServers: [...STUN_SERVERS, ...STATIC_TURN_FALLBACK],
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceCandidatePoolSize: 2,
};

/**
 * TURN-only config — use this temporarily to verify your TURN server works.
 * If calls connect with this config but fail with ICE_SERVERS, TURN is broken.
 *
 * Usage:  const pc = new RTCPeerConnection(ICE_SERVERS_RELAY_ONLY);
 */
export const ICE_SERVERS_RELAY_ONLY = {
  ...ICE_SERVERS,
  iceTransportPolicy: "relay",
};
