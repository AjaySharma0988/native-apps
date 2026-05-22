import { useEffect, useState } from "react";
import { Minus, Square, X, Copy } from "lucide-react";

const WindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = !!window.electronAPI;
  const isMac = isElectron && window.electronAPI.app.getPlatform() === "darwin";

  useEffect(() => {
    if (!isElectron) return;

    // Check initial state
    window.electronAPI.window.isMaximized().then(setIsMaximized).catch(() => {});

    // Periodic check to capture snap-layouts or native OS drag-to-top maximizes
    const interval = setInterval(() => {
      window.electronAPI.window.isMaximized().then(setIsMaximized).catch(() => {});
    }, 500);

    return () => clearInterval(interval);
  }, [isElectron]);

  if (!isElectron || isMac) return null;

  const handleMinimize = () => {
    window.electronAPI.window.minimize();
  };

  const handleMaximize = async () => {
    await window.electronAPI.window.maximize();
    const state = await window.electronAPI.window.isMaximized();
    setIsMaximized(state);
  };

  const handleClose = () => {
    window.electronAPI.window.close();
  };

  return (
    <div className="flex items-center h-full titlebar-nodrag select-none">
      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        title="Minimize"
        className="w-11 h-full flex items-center justify-center text-base-content/75 hover:bg-base-content/10 transition-colors focus:outline-none cursor-pointer"
      >
        <Minus size={14} className="stroke-[2px]" />
      </button>

      {/* Maximize / Restore Button */}
      <button
        onClick={handleMaximize}
        title={isMaximized ? "Restore Down" : "Maximize"}
        className="w-11 h-full flex items-center justify-center text-base-content/75 hover:bg-base-content/10 transition-colors focus:outline-none cursor-pointer"
      >
        {isMaximized ? (
          <Copy size={12} className="rotate-180 stroke-[2px]" />
        ) : (
          <Square size={12} className="stroke-[2px]" />
        )}
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        title="Close"
        className="w-11 h-full flex items-center justify-center text-base-content/75 hover:bg-red-600 hover:text-white transition-colors focus:outline-none cursor-pointer"
      >
        <X size={15} className="stroke-[2.5px]" />
      </button>
    </div>
  );
};

export default WindowControls;
