/**
 * Electron Preload Script
 *
 * This script runs in a special context that has access to both
 * the DOM and Node.js APIs. It uses contextBridge to expose
 * ONLY the APIs we explicitly allow to the renderer process.
 *
 * Security model:
 * - contextIsolation: true  → renderer cannot access Node.js globals
 * - nodeIntegration: false  → no require() in renderer
 * - This preload bridge = the ONLY approved communication channel
 *
 * Available in renderer as: window.electronAPI.*
 */

const { contextBridge, ipcRenderer } = require("electron");

// Fetch environment synchronously from main process at startup
let envs = {
  VITE_API_URL: "http://localhost:5001/api",
  VITE_SOCKET_URL: "http://localhost:5001"
};
try {
  envs = ipcRenderer.sendSync("store:get-env-sync");
} catch (e) {
  console.error("Failed to fetch environment synchronously:", e);
}

contextBridge.exposeInMainWorld("electronAPI", {
  env: envs,

  // Compatibility flat APIs
  storeGet: (key) => ipcRenderer.invoke("store:get", key),
  storeSet: (key, value) => ipcRenderer.invoke("store:set", key, value),
  storeDelete: (key) => ipcRenderer.invoke("store:delete", key),

  // ── Persistent Storage (replaces localStorage) ────────────────────────
  store: {
    get: (key) => ipcRenderer.invoke("store:get", key),
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
    delete: (key) => ipcRenderer.invoke("store:delete", key),
    clear: () => ipcRenderer.invoke("store:clear"),
  },

  // ── Call Window Management (replaces window.open + BroadcastChannel) ──
  call: {
    /** Opens the dedicated call BrowserWindow with given URL params */
    openWindow: (params) => ipcRenderer.invoke("call:open-window", params),
    /** Close the call window from the main window */
    closeWindow: () => ipcRenderer.invoke("call:close-window"),
    /** Resize call window to PiP mode (alwaysOnTop small overlay) */
    enablePip: () => ipcRenderer.invoke("call:enable-pip"),
    /** Restore call window to full size */
    disablePip: () => ipcRenderer.invoke("call:disable-pip"),
    /** Focus the call window */
    focusWindow: () => ipcRenderer.invoke("call:focus-window"),
    /** Bring the main window back up for an incoming call */
    focusForIncomingCall: () => ipcRenderer.invoke("call:focus-for-incoming"),
    /** Send a message TO the call window (replaces BroadcastChannel) */
    sendToCallWindow: (message) => ipcRenderer.invoke("call:send-to-window", message),
    /** Send a message FROM the call window to the main window */
    sendToMainWindow: (message) => ipcRenderer.invoke("call:send-to-main", message),
    /** Listen for messages from the opposite window */
    onMessage: (callback) => {
      const handler = (_, data) => callback(data);
      ipcRenderer.on("call:message", handler);
      // Return cleanup function
      return () => ipcRenderer.off("call:message", handler);
    },
  },

  // ── Native Notifications ──────────────────────────────────────────────
  notifications: {
    /** Show a native OS notification */
    show: (options) => ipcRenderer.invoke("notification:show", options),
    /** Request notification permission (Electron handles this natively) */
    requestPermission: () => ipcRenderer.invoke("notification:request-permission"),
  },

  // ── Window Controls ───────────────────────────────────────────────────
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    /** Minimize to tray instead of taskbar */
    minimizeToTray: () => ipcRenderer.invoke("window:minimize-to-tray"),
    isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
    /** Listen for window focus/blur */
    onFocus: (callback) => {
      ipcRenderer.on("window:focused", callback);
      return () => ipcRenderer.off("window:focused", callback);
    },
  },

  // ── App Info ──────────────────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke("app:version"),
    getPlatform: () => process.platform,
    isElectron: true,
    onPowerResume: (callback) => {
      const handler = () => callback();
      ipcRenderer.on("lifecycle:power-resume", handler);
      return () => ipcRenderer.off("lifecycle:power-resume", handler);
    },
    onPowerSuspend: (callback) => {
      const handler = () => callback();
      ipcRenderer.on("lifecycle:power-suspend", handler);
      return () => ipcRenderer.off("lifecycle:power-suspend", handler);
    },
  },
});
