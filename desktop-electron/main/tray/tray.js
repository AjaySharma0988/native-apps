/**
 * System Tray
 *
 * Creates a tray icon so Chatty lives in the system tray
 * when the main window is closed/minimized.
 * Behavior mirrors Discord/Telegram desktop apps.
 */

const { Tray, Menu, nativeImage, app } = require("electron");
const path = require("path");

function createTray(mainWindow) {
  // Use a PNG icon (will be automatically sized for tray)
  const iconPath = path.join(__dirname, "../../assets/tray-icon.png");
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) throw new Error("Empty icon");
  } catch {
    // Fallback: create a tiny colored icon
    icon = nativeImage.createEmpty();
  }

  const tray = new Tray(icon);
  tray.setToolTip("Chatty");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Chatty",
      type: "normal",
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit Chatty",
      type: "normal",
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Single click on tray icon → show/hide window
  tray.on("click", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Handle window close → minimize to tray instead of quitting
  mainWindow.on("close", (event) => {
    // On Windows/Linux, prevent close and hide to tray instead
    if (process.platform !== "darwin") {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  return tray;
}

module.exports = { createTray };
