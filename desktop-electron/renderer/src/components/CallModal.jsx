import { useCallStore, focusCallWindow, stopRingtone } from "../store/useCallStore";
import { Phone, PhoneOff, Video, Minus, MoreHorizontal, Mic, MicOff, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CallModal = () => {
  const { incomingCall, outgoingCall, activeCall, acceptCall, rejectCall, endCall, isIgnored, ignoreCall, unignoreCall } = useCallStore();

  const [previewCamOff, setPreviewCamOff] = useState(false);
  const [previewMicOff, setPreviewMicOff] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const videoRef = useRef(null);

  // Clean up local stream when modal unmounts or call is accepted/ignored
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [localStream]);

  // Request media for incoming video calls
  useEffect(() => {
    if (incomingCall && incomingCall.callType === "video" && !isIgnored && !localStream) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("[CallModal] Preview media error:", err);
          // Don't fail the call just because preview failed
        });
    }
  }, [incomingCall, isIgnored, localStream]);

  // Sync preview toggles to the stream tracks so user sees the effect immediately
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !previewCamOff));
      localStream.getAudioTracks().forEach((t) => (t.enabled = !previewMicOff));
    }
  }, [previewCamOff, previewMicOff, localStream]);

  // ── "Return to call" mini-banner when popup is open ────────────────────
  if (!incomingCall && (outgoingCall || activeCall)) {
    const target = activeCall || outgoingCall;
    const peerName = target.callerInfo?.fullName || target.to?.fullName || "Call";

    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3
                      bg-base-200 border border-base-300 rounded-full px-5 py-2.5 shadow-2xl animate-bounce-once">
        <span className="size-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-base-content">
          {target.callType === "video" ? "📹" : "📞"} {peerName} · {activeCall ? "In call" : "Calling"}
        </span>
        <button
          onClick={() => focusCallWindow()}
          className="text-xs text-green-400 font-semibold hover:text-green-300 transition-colors"
        >
          Click to return
        </button>
        <button
          onClick={endCall}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          End
        </button>
      </div>
    );
  }

  if (!incomingCall) return null;
  // FATAL BUG GUARD: Never render the modal overlay inside the dedicated Call Popup Window.
  // With HashRouter, the route lives in window.location.hash (e.g. #/call), not pathname.
  const isCallWindow = window.location.pathname === "/call" || window.location.hash.includes("/call");
  if (isCallWindow) return null;

  const isVideo = incomingCall.callType === "video";
  const callerInfo = incomingCall.callerInfo;

  // ── Ignored State ────────────────────────────────────────────────────────
  if (isIgnored) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3
                      bg-base-200 border border-base-300 rounded-full px-5 py-2.5 shadow-2xl cursor-pointer hover:bg-base-300 transition-colors"
           onClick={unignoreCall}
      >
        <div className="relative">
          <img src={callerInfo?.profilePic || "/avatar.png"} alt="avatar" className="size-6 rounded-full object-cover" />
          <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500 animate-pulse border border-base-200" />
        </div>
        <span className="text-sm font-medium text-base-content">
          Incoming {isVideo ? "video" : "voice"} call from {callerInfo?.fullName || "Unknown"}
        </span>
        <span className="text-xs text-green-400 font-semibold ml-2">Review</span>
      </div>
    );
  }

  // ── Full Modal State (WhatsApp Desktop style) ────────────────────────────
  const handleAccept = () => {
    stopRingtone();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    acceptCall({ isMuted: previewMicOff, isCameraOff: previewCamOff });
  };

  const handleDecline = () => {
    stopRingtone();
    rejectCall();
  };

  const toggleCam = (e) => {
    e.stopPropagation();
    setPreviewCamOff(!previewCamOff);
  };
  
  const toggleMic = (e) => {
    e.stopPropagation();
    setPreviewMicOff(!previewMicOff);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div
        className="rounded-xl flex flex-col shadow-2xl w-[360px] overflow-hidden"
        style={{
          background: "oklch(var(--b1))",
          border: "1px solid oklch(var(--bc) / 0.1)",
        }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <div className="flex items-center gap-2">
            {/* WhatsApp Icon (Placeholder using a circular div for similarity) */}
            <div className="size-5 rounded-full bg-success flex items-center justify-center">
              <Phone className="size-3 text-white fill-white" />
            </div>
            <span className="text-sm font-medium text-base-content">Chatty</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); ignoreCall(); }}
            className="text-base-content/50 hover:text-base-content transition-colors p-1"
          >
            <Minus className="size-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6">
          <div className="size-20 rounded-full overflow-hidden bg-base-300 mb-4">
            <img
              src={callerInfo?.profilePic || "/avatar.png"}
              alt={callerInfo?.fullName}
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-2xl font-normal text-base-content mb-1">
            {callerInfo?.fullName || "Unknown"}
          </h2>
          <p className="text-[15px] text-base-content/60 mb-6">
            {isVideo ? "Video call" : "Voice call"}
          </p>

          {/* Local Video Preview */}
          {isVideo && (
            <div className="relative w-full h-[180px] bg-base-100 rounded-lg overflow-hidden mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain transform -scale-x-100"
              />
              {!localStream && (
                <div className="absolute inset-0 flex items-center justify-center text-base-content/50 text-sm">
                  Starting camera...
                </div>
              )}
              {/* Media Controls Overlay */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-4">
                <button 
                  onClick={toggleCam}
                  className="size-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: previewCamOff ? "#ef4444" : "rgba(32,44,51,0.8)" }}
                >
                  {previewCamOff ? <VideoOff className="size-5 text-white" /> : <Video className="size-5 text-white" />}
                </button>
                <button 
                  onClick={toggleMic}
                  className="size-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: previewMicOff ? "#ef4444" : "rgba(32,44,51,0.8)" }}
                >
                  {previewMicOff ? <MicOff className="size-5 text-white" /> : <Mic className="size-5 text-white" />}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between w-full mt-2 gap-3">
            {/* Options Button */}
            <button 
              className="size-12 rounded-xl bg-base-300 hover:bg-base-200 flex items-center justify-center transition-colors shrink-0"
            >
              <MoreHorizontal className="size-6 text-base-content/60" />
            </button>

            {/* Accept Button */}
            <button 
              onClick={handleAccept}
              className="flex-1 h-12 rounded-xl bg-[#00A884] hover:bg-[#06CF9C] flex items-center justify-center gap-2 transition-colors font-medium text-[#111B21]"
            >
              {isVideo ? <Video className="size-5" /> : <Phone className="size-5 fill-current" />}
              Accept
            </button>

            {/* Decline Button */}
            <button 
              onClick={handleDecline}
              className="size-12 rounded-xl bg-[#F15C6D] hover:bg-[#EF4444] flex items-center justify-center transition-colors shrink-0"
            >
              <PhoneOff className="size-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
