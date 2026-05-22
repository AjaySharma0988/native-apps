/**
 * Call IPC Handlers
 *
 * Manages call window lifecycle and cross-window messaging.
 * This is the Electron replacement for:
 *   - window.open()       → openCallWindow()
 *   - window.close()      → closeCallWindow()
 *   - BroadcastChannel    → ipcMain message relay
 */

const {
  openCallWindow,
  enablePip,
  disablePip,
  closeCallWindow,
  focusCallWindow,
  getCallWindow,
} = require("../windows/callWindow");

const isDev = global.isDev;
const RENDERER_URL = global.RENDERER_URL;
const RENDERER_FILE = global.RENDERER_FILE;

function registerCallIpc(ipcMain) {
  /**
   * Open the call window.
   * params: URLSearchParams string (callType, peerId, peerName, isCaller, etc.)
   */
  ipcMain.handle("call:open-window", (_, params) => {
    const callUrl = isDev
      ? `${RENDERER_URL}/call?${params}`
      : `file://${RENDERER_FILE.replace("index.html", "")}index.html#/call?${params}`;
    openCallWindow(callUrl);
    return true;
  });

  /** Close the call window */
  ipcMain.handle("call:close-window", () => {
    closeCallWindow();
    return true;
  });

  /** Switch to PiP mode */
  ipcMain.handle("call:enable-pip", () => {
    enablePip();
    return true;
  });

  /** Exit PiP mode */
  ipcMain.handle("call:disable-pip", () => {
    disablePip();
    return true;
  });

  /** Focus the call window */
  ipcMain.handle("call:focus-window", () => {
    focusCallWindow();
    return true;
  });

  /**
   * Relay a message from main window → call window.
   * Replaces: BroadcastChannel.postMessage() from main window side.
   *
   * Message types (matching web app's BroadcastChannel messages):
   *   INCOMING_CALL, FORWARD_ICE_CANDIDATE, FORCE_TIMEOUT
   */
  ipcMain.handle("call:send-to-window", (_, message) => {
    const callWin = getCallWindow();
    if (callWin) {
      callWin.webContents.send("call:message", message);
      return true;
    }
    return false;
  });

  /**
   * Relay a message from call window → main window.
   * Replaces: BroadcastChannel.postMessage() from call window side.
   *
   * Message types:
   *   POPUP_READY, POPUP_TOOK_OVER, CALL_ACCEPTED, CALL_ENDED, CALL_AGAIN
   */
  ipcMain.handle("call:send-to-main", (_, message) => {
    const mainWindow = global.mainWindow;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("call:message", message);
      return true;
    }
    return false;
  });
}

module.exports = { registerCallIpc };
