/**
 * Electron Store IPC Handlers
 *
 * Provides persistent key-value storage for the renderer process.
 * Replaces localStorage which is web-only.
 *
 * electron-store is Node.js only (main process).
 * Renderer accesses it via IPC through window.electronAPI.store.*
 */

/**
 * Electron Store IPC Handlers
 *
 * Provides persistent key-value storage for the renderer process.
 * Replaces localStorage which is web-only.
 *
 * electron-store is Node.js only (main process).
 * Renderer accesses it via IPC through window.electronAPI.store.*
 */

const fs = require("fs");
const path = require("path");
const Store = require("electron-store");

let store = null;

/**
 * Robustly parses a local .env file if present in the development or app paths.
 */
function loadEnv() {
  const env = {
    VITE_API_URL: "http://localhost:5001/api",
    VITE_SOCKET_URL: "http://localhost:5001"
  };

  const pathsToSearch = [
    path.join(__dirname, "../.env"),          // d:\Code\Realtime-chat-App-main\native-apps\desktop-electron\main\..\.env
    path.join(__dirname, "../../.env"),       // Root folder of desktop-electron
    path.join(process.cwd(), ".env"),         // Current working directory
    path.join(path.dirname(process.execPath), ".env"), // Next to packed executable
  ];

  for (const envPath of pathsToSearch) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...valueParts] = trimmed.split("=");
            const value = valueParts.join("=").trim();
            if (key && value) {
              env[key.trim()] = value;
            }
          }
        });
        break; // Stop after first successful load
      } catch (err) {
        console.error("Failed to parse .env file:", err);
      }
    }
  }
  return env;
}

/**
 * Synchronously initializes the electron-store with environment fallbacks.
 */
function initStore() {
  if (!store) {
    const defaultEnv = loadEnv();
    const api_url = process.env.VITE_API_URL || defaultEnv.VITE_API_URL;
    const socket_url = process.env.VITE_SOCKET_URL || defaultEnv.VITE_SOCKET_URL;

    store = new Store({
      name: "chatty-data",
      defaults: {
        api_url: api_url,
        socket_url: socket_url,
      }
    });

    // In development mode, always update the store from the latest .env file
    const isDev = process.env.NODE_ENV !== "production" && !require("electron").app.isPackaged;
    if (isDev) {
      const currentEnv = loadEnv();
      store.set("api_url", currentEnv.VITE_API_URL);
      store.set("socket_url", currentEnv.VITE_SOCKET_URL);
    }
  }
  return store;
}

function registerStoreIpc(ipcMain) {
  // Eagerly initialize store at startup
  initStore();

  // ── Synchronous Environment Bridge ───────────────────────────────────────
  ipcMain.on("store:get-env-sync", (event) => {
    try {
      const s = initStore();
      event.returnValue = {
        VITE_API_URL: s.get("api_url") || "http://localhost:5001/api",
        VITE_SOCKET_URL: s.get("socket_url") || "http://localhost:5001"
      };
    } catch (e) {
      event.returnValue = {
        VITE_API_URL: "http://localhost:5001/api",
        VITE_SOCKET_URL: "http://localhost:5001"
      };
    }
  });

  // ── Standard Key-Value Storage APIs ───────────────────────────────────────
  ipcMain.handle("store:get", async (_, key) => {
    const s = initStore();
    return s.get(key);
  });

  ipcMain.handle("store:set", async (_, key, value) => {
    const s = initStore();
    s.set(key, value);
    return true;
  });

  ipcMain.handle("store:delete", async (_, key) => {
    const s = initStore();
    s.delete(key);
    return true;
  });

  ipcMain.handle("store:clear", async () => {
    const s = initStore();
    s.clear();
    return true;
  });
}

module.exports = { registerStoreIpc };
