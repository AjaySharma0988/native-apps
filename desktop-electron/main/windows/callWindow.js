/**
 * Call Window Factory
 *
 * Creates a dedicated BrowserWindow for video/audio calls.
 * Replaces the web app's window.open() popup approach.
 *
 * Modes:
 * - Full: 1000x700 — main call experience (camera, controls)
 * - PiP:  320x240  — alwaysOnTop floating overlay (like Discord)
 */

const { BrowserWindow } = require("electron");
const path = require("path");

let callWin = null;
let isPip = false;

const FULL_SIZE = { width: 1000, height: 700 };
const PIP_SIZE = { width: 320, height: 240 };

/**
 * Opens the call window (or focuses it if already open).
 * @param {string} url - The URL to load (includes call params)
 */
function openCallWindow(url) {
  if (callWin && !callWin.isDestroyed()) {
    // Reuse existing window — update route
    callWin.loadURL(url);
    callWin.focus();
    return callWin;
  }

  callWin = new BrowserWindow({
    ...FULL_SIZE,
    minWidth: 640,
    minHeight: 480,
    title: "Chatty — Call",
    resizable: true,
    alwaysOnTop: true,
    backgroundColor: "#000000",
    show: false,
    icon: path.join(__dirname, "../../assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  callWin.loadURL(url);
  callWin.once("ready-to-show", () => callWin.show());

  // Set OS-specific floating level on creation
  callWin.setAlwaysOnTop(true, "floating");

  // Reassert always-on-top if focus is lost (blur)
  callWin.on("blur", () => {
    if (callWin && !callWin.isDestroyed()) {
      callWin.setAlwaysOnTop(true, "floating");
    }
  });

  // Reassert if always-on-top changes
  callWin.on("always-on-top-changed", (event, isAlwaysOnTop) => {
    if (!isAlwaysOnTop && callWin && !callWin.isDestroyed()) {
      callWin.setAlwaysOnTop(true, "floating");
    }
  });

  callWin.on("closed", () => {
    callWin = null;
    isPip = false;
  });

  return callWin;
}

/**
 * Enable PiP mode — make window small, always-on-top, frameless overlay.
 * Behavior: like Discord's floating call indicator.
 */
function enablePip() {
  if (!callWin || callWin.isDestroyed()) return;
  callWin.setAlwaysOnTop(true, "floating");
  callWin.setSize(PIP_SIZE.width, PIP_SIZE.height);
  callWin.setResizable(false);
  // Position in bottom-right corner
  const { screen } = require("electron");
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  callWin.setPosition(width - PIP_SIZE.width - 20, height - PIP_SIZE.height - 20);
  isPip = true;
}

/**
 * Disable PiP mode — restore to full call window.
 */
function disablePip() {
  if (!callWin || callWin.isDestroyed()) return;
  callWin.setAlwaysOnTop(true, "floating");
  callWin.setSize(FULL_SIZE.width, FULL_SIZE.height);
  callWin.setResizable(true);
  callWin.center();
  isPip = false;
}

function closeCallWindow() {
  if (callWin && !callWin.isDestroyed()) {
    callWin.close();
    callWin = null;
  }
}

function focusCallWindow() {
  if (callWin && !callWin.isDestroyed()) {
    if (callWin.isMinimized()) callWin.restore();
    callWin.focus();
  }
}

function getCallWindow() {
  return callWin && !callWin.isDestroyed() ? callWin : null;
}

module.exports = {
  openCallWindow,
  enablePip,
  disablePip,
  closeCallWindow,
  focusCallWindow,
  getCallWindow,
};
