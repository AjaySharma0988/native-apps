import React, { useState } from "react";
import { X, Globe, ChevronLeft, ChevronRight, RotateCw, Settings, Maximize2, MoreHorizontal } from "lucide-react";

const VBrowserModule = ({ 
  isVBrowserActive, 
  vBrowserUrl, 
  setVBrowserUrl, 
  controller, 
  setController, 
  socket, 
  callId, 
  peerName,
  setIsVBrowserActive,
  setActiveFeature
}) => {
  const [inputUrl, setInputUrl] = useState(vBrowserUrl);
  const isController = controller === "me";

  const handleNavigate = (e) => {
    if (e.key === "Enter") {
      let url = inputUrl;
      if (!url.startsWith("http")) url = "https://" + url;
      setVBrowserUrl(url);
      socket.emit("vbrowser:navigate", { callId, url });
    }
  };

  const stopVBrowser = () => {
    setIsVBrowserActive(false);
    setActiveFeature("home");
    socket.emit("vbrowser:stop", { callId });
  };

  const toggleController = (newController) => {
    setController(newController);
    socket.emit("vbrowser:controller", { callId, controller: newController });
  };

  if (!isVBrowserActive) return null;

  return (
    <div className="vbrowser-container w-full h-full flex flex-col bg-base-200 rounded-xl overflow-hidden border border-base-300 shadow-2xl animate-in fade-in zoom-in duration-300">
      {/* 🧩 TASK 2 & 8: UI HEADER (CHROME-LIKE) */}
      <div className="vbrowser-header h-14 bg-base-300 border-b border-base-200/50 flex items-center px-4 gap-4 flex-shrink-0">
        
        {/* LEFT: STOP BUTTON */}
        <button 
          onClick={stopVBrowser}
          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors group relative"
          title="Stop Browser"
        >
          <X className="size-5" />
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Stop VBrowser</span>
        </button>

        {/* NAVIGATION CONTROLS */}
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-full hover:bg-base-content/10 text-base-content/40 cursor-not-allowed"><ChevronLeft className="size-4" /></button>
          <button className="p-1.5 rounded-full hover:bg-base-content/10 text-base-content/40 cursor-not-allowed"><ChevronRight className="size-4" /></button>
          <button className="p-1.5 rounded-full hover:bg-base-content/10 text-base-content/60"><RotateCw className="size-4" /></button>
        </div>

        {/* CENTER: URL BAR */}
        <div className="flex-1 max-w-2xl bg-base-100 rounded-full border border-base-300 flex items-center px-4 py-1.5 gap-3 group focus-within:border-primary/50 transition-all">
          <Globe className="size-4 text-base-content/40" />
          <input 
            type="text"
            className="bg-transparent border-none outline-none text-base-content text-sm w-full font-medium placeholder:text-base-content/20"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleNavigate}
            placeholder="Search or enter URL..."
            readOnly={!isController}
          />
          {!isController && (
            <div className="px-2 py-0.5 rounded bg-base-200 text-[10px] text-base-content/40 uppercase tracking-tighter shimmer-text">View Only</div>
          )}
        </div>

        {/* RIGHT: CONTROLLER & TOOLS */}
        <div className="flex items-center gap-3">
          {/* CONTROLLER DROPDOWN */}
          <div className="relative group/dropdown">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-200 border border-base-300 hover:bg-base-300 transition-all">
              <div className={`size-2 rounded-full ${isController ? "bg-success shadow-[0_0_8px_oklch(var(--su))]" : "bg-base-content/20"}`} />
              <span className="text-xs font-semibold text-base-content/80">{isController ? "Me" : peerName}</span>
            </button>
            
            <div className="absolute right-0 top-full mt-2 w-40 bg-base-200 border border-base-300 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:translate-y-0 group-hover/dropdown:pointer-events-auto transition-all z-50 p-1">
              <button 
                onClick={() => toggleController("me")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${controller === "me" ? "bg-primary text-primary-content" : "text-base-content/60 hover:bg-base-300"}`}
              >
                Control: Me
              </button>
              <button 
                onClick={() => toggleController("peer")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${controller === "peer" ? "bg-primary text-primary-content" : "text-base-content/60 hover:bg-base-300"}`}
              >
                Control: {peerName}
              </button>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-base-300 mx-1" />

          {/* UI ONLY OPTIONS */}
          <div className="flex items-center gap-1 text-base-content/40">
             <div className="px-2 py-1 rounded bg-base-200 text-[10px] font-bold border border-base-300 text-base-content/60">720p</div>
             <div className="px-2 py-1 rounded bg-base-200 text-[10px] font-bold border border-base-300 text-base-content/60">1x</div>
          </div>
          
          <button className="p-2 rounded-lg hover:bg-base-content/10 text-base-content/60"><Maximize2 className="size-4" /></button>
          <button className="p-2 rounded-lg hover:bg-base-content/10 text-base-content/60"><MoreHorizontal className="size-4" /></button>
        </div>
      </div>

      {/* 🧩 TASK 3, 4 & 9: MEDIA VIEW RENDER (IFRAME) */}
      <div className="vbrowser-viewport flex-1 relative bg-white">
        <iframe 
          src={vBrowserUrl}
          className="vbrowser-frame w-full h-full border-none"
          title="Virtual Browser"
          style={{ 
            pointerEvents: isController ? "auto" : "none",
            backgroundColor: "#fff"
          }}
        />
        
        {!isController && (
           <div className="absolute inset-0 bg-transparent cursor-not-allowed" />
        )}

        {/* LOADING OVERLAY IF NEEDED */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
           <div className="size-1.5 rounded-full bg-success" />
           <span className="text-[10px] font-bold text-white uppercase tracking-widest shimmer-text">{isController ? "Live Control" : `Watching ${peerName}`}</span>
        </div>
      </div>
    </div>
  );
};

export default VBrowserModule;
