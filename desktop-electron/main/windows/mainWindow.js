/**
 * Main Window Factory
 *
 * Creates the primary application BrowserWindow.
 * Sized like Discord/Telegram — full-featured desktop chat UI.
 */

const { BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createMainWindow({ isDev, RENDERER_URL, RENDERER_FILE }) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Chatty",
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0f0f0f",
    show: false, // Don't show until ready-to-show to prevent white flash
    icon: path.join(__dirname, "../../assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,   // Security: isolate renderer from Node
      nodeIntegration: false,   // Security: no require() in renderer
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Load renderer
  if (isDev) {
    win.loadURL(RENDERER_URL);
    // Open DevTools in dev mode
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(RENDERER_FILE);
  }

  // Show window once DOM is ready (prevents white flash)
  win.once("ready-to-show", () => {
    win.show();
  });

  // Notify renderer when window gains focus
  win.on("focus", () => {
    win.webContents.send("window:focused", true);
  });

  win.on("blur", () => {
    win.webContents.send("window:focused", false);
  });

  // ── Window Control IPC Handlers ─────────────────────────────────────────
  ipcMain.handle("window:minimize", () => win.minimize());
  ipcMain.handle("window:maximize", () => {
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.handle("window:close", () => win.close());
  ipcMain.handle("window:minimize-to-tray", () => win.hide());
  ipcMain.handle("window:is-maximized", () => win.isMaximized());
  ipcMain.handle("app:version", () => require("../../package.json").version);

  return win;
}

module.exports = { createMainWindow };
