# Chatty — Native App Expansion

This directory contains the cross-platform native apps built on top of the existing web backend.

## Structure

```
native-apps/
├── shared-core/           # Shared TypeScript package (@chatty/shared-core)
│   └── src/
│       ├── types/         # TypeScript interfaces (mirrors backend models)
│       ├── constants/     # Socket events, WebRTC ICE config, API routes
│       ├── api/           # Platform-agnostic Axios factory
│       ├── socket/        # Cross-platform Socket.IO manager
│       ├── auth/          # Token storage abstraction
│       └── utils/         # Date formatting, message utils
│
├── desktop-electron/      # Electron Desktop App
│   ├── main/              # Node.js main process
│   │   ├── main.js        # Entry point — app lifecycle, IPC registration
│   │   ├── preload.js     # contextBridge API (security layer)
│   │   ├── windows/       # BrowserWindow factories (main + call + PiP)
│   │   ├── ipc/           # IPC handlers (store, call, notifications)
│   │   └── tray/          # System tray
│   └── renderer/          # React app (runs in Chromium)
│       └── src/
│           ├── store/     # Electron-specific Zustand stores
│           ├── pages/     # Login, Home, Call, Settings
│           └── components/# Sidebar, ChatArea, IncomingCallModal, Loader
│
└── mobile-react-native/   # React Native Mobile App (iOS + Android)
    └── src/
        ├── store/         # RN-specific stores (AsyncStorage + react-native-webrtc)
        ├── screens/       # Login, Signup, Home, Chat, Call, Profile
        ├── components/    # IncomingCallOverlay
        ├── navigation/    # React Navigation stack
        ├── services/      # FCM (push notifications), CallKeep (native call UI)
        └── utils/         # tokenStorage (AsyncStorage), dateUtils
```

## Key Architecture Decisions

| Problem | Web Solution | Electron Solution | RN Solution |
|---|---|---|---|
| Auth persistence | `httpOnly cookie` | `electron-store` via IPC | `AsyncStorage` |
| Auth transport | Cookie | `Bearer token` (body) | `Bearer token` (body) |
| Socket auth | Cookie | `handshake.auth.token` | `handshake.auth.token` |
| Call popup | `window.open()` | `BrowserWindow` via IPC | React Navigation |
| Cross-window msg | `BroadcastChannel` | `ipcMain` relay | N/A (same process) |
| Notifications | `Notification API` | `Electron Notification` | FCM + local notif |
| Video rendering | `<video>` HTML | `<video>` HTML (Chromium) | `RTCView` (react-native-webrtc) |
| Incoming call UI | Browser popup | Electron overlay | CallKeep (iOS CallKit / Android) |

## Running Locally

### Backend (no changes required)
```bash
# From project root
cd backend && npm run dev
```

### Electron Desktop App
```bash
cd native-apps/desktop-electron
npm install
npm run electron:dev
```
> Opens Vite dev server on port 3000, then launches Electron pointing to it.

### React Native (requires Android Studio or Xcode)
```bash
cd native-apps/mobile-react-native
npm install
npx react-native start     # Start Metro bundler
npx react-native run-android   # or run-ios
```

## Backend Changes Made

All changes are **backward-compatible** (web app unaffected):

1. **CORS** — Added `localhost:3000` (Electron) and `localhost:8081` (RN Metro) to dev allowlist
2. **Socket CORS** — Same additions to Socket.IO origin list
3. **Auth responses** — `login` and `signup` now include `token` field in JSON body  
   (web clients already ignore unknown fields; RN/Electron use this for Bearer auth)
