import { ArrowLeft, MoreVertical, Phone, Video, Info } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { formatMessageTime } from "../lib/utils";

const MobileCallInfo = ({ call, onBack }) => {
  const { startCall } = useCallStore();
  if (!call) return null;

  const peer = call.peerInfo;

  return (
    <div className="fixed inset-0 z-[80] w-full h-[100dvh] bg-base-100 flex flex-col md:hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-16 bg-base-200 flex items-center px-2 gap-1 border-b border-base-300">
        <button onClick={onBack} className="p-2 hover:bg-base-300 rounded-full text-base-content">
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="flex-1 text-xl font-bold text-base-content ml-2">Call info</h1>
        <button className="p-3 hover:bg-base-300 rounded-full text-base-content/70">
          <MoreVertical className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Contact Info */}
        <div className="flex flex-col items-center p-8 bg-base-200 mb-2 border-b border-base-300">
          <img src={peer?.profilePic || "/avatar.png"} className="size-32 rounded-full object-cover mb-4 shadow-xl" />
          <h2 className="text-2xl font-bold text-base-content text-center mb-1">{peer?.fullName}</h2>
          <p className="text-base-content/50 mb-6 text-sm">2 people</p>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <button 
              onClick={() => startCall(peer, "audio")}
              className="flex flex-col items-center gap-2 p-4 bg-base-300/50 rounded-2xl hover:bg-base-300 transition-colors"
            >
              <Phone className="size-6 text-primary" />
              <span className="text-xs text-base-content">Audio</span>
            </button>
            <button 
              onClick={() => startCall(peer, "video")}
              className="flex flex-col items-center gap-2 p-4 bg-base-300/50 rounded-2xl hover:bg-base-300 transition-colors"
            >
              <Video className="size-6 text-primary" />
              <span className="text-xs text-base-content">Video</span>
            </button>
          </div>
        </div>

        {/* Date Section */}
        <div className="p-4">
          <h3 className="text-primary text-xs font-bold uppercase tracking-wider mb-4">Today</h3>
          <div className="flex items-center gap-4 py-2">
            <div className="size-10 bg-base-300/50 rounded-full flex items-center justify-center">
               <Phone className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-base-content font-bold">Incoming</h4>
              <p className="text-base-content/50 text-xs">{formatMessageTime(call.createdAt)} • {call.duration || 0}s</p>
            </div>
            <div className="text-right">
              <p className="text-base-content/50 text-xs">37s</p>
              <p className="text-base-content/50 text-xs">79 kB</p>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="p-4 mt-4">
           <h3 className="text-base-content/50 text-sm font-medium mb-4">2 people</h3>
           <div className="space-y-6">
              <ParticipantItem user={peer} />
              <ParticipantItem user={{ fullName: "You", profilePic: "/avatar.png" }} />
           </div>
        </div>
      </div>
    </div>
  );
};

const ParticipantItem = ({ user }) => (
  <div className="flex items-center gap-4">
    <img src={user.profilePic || "/avatar.png"} className="size-12 rounded-full object-cover" />
    <div className="flex-1">
      <h4 className="text-base-content font-bold">{user.fullName}</h4>
    </div>
    <div className="flex items-center gap-2">
       <button className="p-2 text-base-content/50"><Phone className="size-5" /></button>
       <button className="p-2 text-base-content/50"><Video className="size-5" /></button>
    </div>
  </div>
);

export default MobileCallInfo;
