/**
 * Electron Main Process Entry Point
 *
 * Responsibilities:
 * - Create and manage BrowserWindow instances (main + call)
 * - Register IPC handlers (store, call, notification)
 * - Manage system tray
 * - Handle app lifecycle events
 *
 * Architecture notes:
 * - Uses contextIsolation: true + nodeIntegration: false (security best practice)
 * - All Node.js APIs exposed to renderer via preload.js contextBridge
 * - Call windows use ipcMain↔ipcRenderer instead of web's BroadcastChannel
 */

const { app, BrowserWindow, ipcMain, shell, Menu, powerMonitor } = require("electron");
const path = require("path");

// ── Import sub-modules ──────────────────────────────────────────────────────
const { createMainWindow } = require("./windows/mainWindow");
const { createTray } = require("./tray/tray");
const { registerStoreIpc } = require("./ipc/storeIpc");
const { registerCallIpc } = require("./ipc/callIpc");
const { registerNotificationIpc } = require("./ipc/notificationIpc");

// ── Dev or production? ──────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== "production" && !app.isPackaged;
const RENDERER_URL = isDev ? "http://localhost:3000" : null;
const RENDERER_FILE = path.join(__dirname, "../renderer/dist/index.html");

// Export for use in other main-process modules
global.isDev = isDev;
global.RENDERER_URL = RENDERER_URL;
global.RENDERER_FILE = RENDERER_FILE;

let mainWindow = null;
let tray = null;

// ── Command line switches to prevent background throttling ───────────────────
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-background-timer-throttling");

// ── Single instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  // If a second instance is launched, focus the existing window
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── App Ready ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Disable native menu bar completely
  Menu.setApplicationMenu(null);

  // Register all IPC handlers BEFORE creating windows
  registerStoreIpc(ipcMain);
  registerCallIpc(ipcMain);
  registerNotificationIpc(ipcMain);

  // Create main window
  mainWindow = createMainWindow({ isDev, RENDERER_URL, RENDERER_FILE });
  global.mainWindow = mainWindow;

  // Listen to power state changes to restore connection when computer resumes
  powerMonitor.on("resume", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("lifecycle:power-resume");
    }
  });
  powerMonitor.on("suspend", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("lifecycle:power-suspend");
    }
  });

  // Create system tray
  tray = createTray(mainWindow);

  // Handle external links — open in default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    const allowedHosts = ["localhost", "127.0.0.1"];
    if (parsedUrl.protocol.startsWith("http") && !allowedHosts.includes(parsedUrl.hostname)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { 
      action: "allow", 
      overrideBrowserWindowOptions: {
        width: 1000,
        height: 700,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        }
      } 
    };
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow({ isDev, RENDERER_URL, RENDERER_FILE });
    }
  });
});

// ── Quit behavior ─────────────────────────────────────────────────────────────
app.on("window-all-closed", () => {
  // On macOS apps stay active until explicitly quit
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ── Security: prevent new window creation ────────────────────────────────────
app.on("web-contents-created", (_, contents) => {
  contents.on("will-navigate", (event, url) => {
    const parsedUrl = new URL(url);
    const allowedHosts = ["localhost", "127.0.0.1"];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      event.preventDefault();
    }
  });
});
