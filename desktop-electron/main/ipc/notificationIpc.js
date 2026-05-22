/**
 * Notification IPC Handlers
 *
 * Shows native OS notifications via Electron's Notification API.
 * Called from renderer when a new message arrives or an incoming call.
 */

const { Notification } = require("electron");

function registerNotificationIpc(ipcMain) {
  ipcMain.handle("notification:show", (_, { title, body, icon, silent = false }) => {
    if (!Notification.isSupported()) return false;

    const notification = new Notification({
      title: title || "Chatty",
      body: body || "",
      icon: icon || undefined,
      silent,
      urgency: "normal",
    });

    notification.on("click", () => {
      // Focus the main window when notification is clicked
      const mainWindow = global.mainWindow;
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });

    notification.show();
    return true;
  });

  ipcMain.handle("notification:request-permission", () => {
    // Electron has notification permission by default on desktop
    return "granted";
  });
}

module.exports = { registerNotificationIpc };
