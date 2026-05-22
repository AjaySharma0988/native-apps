/**
 * React Native Call Store
 *
 * Uses react-native-webrtc instead of browser RTCPeerConnection.
 * Integrates with react-native-callkeep for native incoming call UI.
 * No BroadcastChannel (RN doesn't have it) — uses EventEmitter instead.
 */

import { create } from 'zustand';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { ICE_SERVERS } from '@chatty/shared-core';
import type { IncomingCall, OutgoingCall, ActiveCall, EndedCall, ChatUser, CallType } from '@chatty/shared-core';

// react-native-webrtc uses the same RTCPeerConnection API surface
let peerConnection: RTCPeerConnection | null = null;
let pendingIceCandidates: RTCIceCandidateInit[] = [];

const resetIceState = () => { pendingIceCandidates = []; };

interface CallState {
  incomingCall: IncomingCall | null;
  outgoingCall: OutgoingCall | null;
  activeCall: ActiveCall | null;
  endedCall: EndedCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callStartTime: number | null;
  isCaller: boolean;
  callHistory: any[];
  isFetchingHistory: boolean;
  pendingIceQueue: RTCIceCandidateInit[];

  startCall: (user: ChatUser, callType: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  cleanup: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  switchCamera: () => void;
  fetchCallHistory: () => Promise<void>;

  handleIncomingCall: (data: IncomingCall) => void;
  handleCallAcceptedByPeer: (data: { answer: RTCSessionDescriptionInit }) => void;
  handleIceCandidate: (data: { candidate: RTCIceCandidateInit | null }) => void;
  handleCallRejected: () => void;
  handleCallEnded: (data?: { reason?: string }) => void;
  handleCallTimeout: () => void;
  handleUserOffline: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  incomingCall: null,
  outgoingCall: null,
  activeCall: null,
  endedCall: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  callStartTime: null,
  isCaller: false,
  callHistory: [],
  isFetchingHistory: false,
  pendingIceQueue: [],

  fetchCallHistory: async () => {
    set({ isFetchingHistory: true });
    try {
      const { apiClient } = await import('./useAuthStore');
      const res = await apiClient.get('/calls');
      set({ callHistory: res.data });
    } catch {} finally {
      set({ isFetchingHistory: false });
    }
  },

  cleanup: () => {
    const { localStream } = get();
    localStream?.getTracks().forEach((t) => t.stop());
    if (peerConnection) { peerConnection.close(); peerConnection = null; }
    resetIceState();

    // End CallKeep call display
    import('../services/CallKeepService').then(({ CallKeepService }) => {
      CallKeepService.endAllCalls();
    });

    set({
      incomingCall: null, outgoingCall: null, activeCall: null,
      localStream: null, remoteStream: null,
      isMuted: false, isCameraOff: false, callStartTime: null,
      isCaller: false, pendingIceQueue: [],
    });
  },

  startCall: async (user, callType) => {
    const { activeCall, outgoingCall, incomingCall } = get();
    if (activeCall || outgoingCall || incomingCall) return;

    const { useAuthStore } = await import('./useAuthStore');
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !authUser) return;

    set({ outgoingCall: { to: user, callType }, isCaller: true });

    try {
      // ── Get local media (react-native-webrtc API) ──────────────────
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false,
      }) as MediaStream;

      set({ localStream: stream });

      // ── Create RTCPeerConnection (react-native-webrtc) ─────────────
      peerConnection = new RTCPeerConnection(ICE_SERVERS as any);
      stream.getTracks().forEach((t) => peerConnection!.addTrack(t, stream));

      (peerConnection as any).ontrack = (e: any) => {
        if (e.streams?.[0]) set({ remoteStream: e.streams[0] });
      };

      (peerConnection as any).onicecandidate = (e: any) => {
        if (e.candidate) socket.emit('ice-candidate', { to: user._id, candidate: e.candidate });
      };

      const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === 'video' });
      await peerConnection.setLocalDescription(offer as RTCSessionDescription);

      socket.emit('call-user', {
        to: user._id,
        offer,
        callType,
        callerInfo: { _id: authUser._id, fullName: authUser.fullName, profilePic: authUser.profilePic },
      });

    } catch (err) {
      console.error('[CallStore] startCall error:', err);
      get().cleanup();
    }
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const { useAuthStore } = await import('./useAuthStore');
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !authUser) return;

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false,
      }) as MediaStream;
      set({ localStream: stream });

      peerConnection = new RTCPeerConnection(ICE_SERVERS as any);
      stream.getTracks().forEach((t) => peerConnection!.addTrack(t, stream));

      (peerConnection as any).ontrack = (e: any) => {
        if (e.streams?.[0]) set({ remoteStream: e.streams[0] });
      };

      (peerConnection as any).onicecandidate = (e: any) => {
        if (e.candidate) socket.emit('ice-candidate', { to: incomingCall.from, candidate: e.candidate });
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCall.offer as any));

      // Drain pending ICE candidates
      for (const c of get().pendingIceQueue) {
        try { await peerConnection.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer as RTCSessionDescription);

      socket.emit('call-accepted', { to: incomingCall.from, answer });

      set({
        activeCall: { with: incomingCall.from, callType: incomingCall.callType, callerInfo: incomingCall.callerInfo },
        callStartTime: Date.now(),
        incomingCall: null, isCaller: false,
      });

    } catch (err) {
      console.error('[CallStore] acceptCall error:', err);
      get().cleanup();
    }
  },

  rejectCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const { useAuthStore } = await import('./useAuthStore');
    const socket = useAuthStore.getState().socket;
    if (socket) socket.emit('call-rejected', { to: incomingCall.from });

    import('../services/CallKeepService').then(({ CallKeepService }) => {
      CallKeepService.endAllCalls();
    });

    get().cleanup();
  },

  endCall: async () => {
    const { activeCall, outgoingCall } = get();
    const targetId = activeCall?.with ?? outgoingCall?.to?._id;

    const { useAuthStore } = await import('./useAuthStore');
    const socket = useAuthStore.getState().socket;
    if (socket && targetId) socket.emit('call:end', { to: targetId, reason: 'ended' });

    get().cleanup();
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    localStream?.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
    set({ isMuted: !isMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    localStream?.getVideoTracks().forEach((t) => { t.enabled = isCameraOff; });
    set({ isCameraOff: !isCameraOff });
  },

  switchCamera: () => {
    const { localStream } = get();
    localStream?.getVideoTracks().forEach((t) => {
      // react-native-webrtc specific API
      (t as any)._switchCamera?.();
    });
  },

  toggleSpeaker: () => {
    // react-native-webrtc: use InCallManager for speaker/earpiece switching
    // import InCallManager from 'react-native-incall-manager';
    // InCallManager.setSpeakerphoneOn(!currentSpeakerState);
    console.log('[CallStore] toggleSpeaker — wire InCallManager here');
  },

  handleIncomingCall: (data: IncomingCall) => {
    const { activeCall, outgoingCall } = get();
    if (activeCall || outgoingCall) {
      import('./useAuthStore').then(({ useAuthStore }) => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.emit('call-rejected', { to: data.from });
      });
      return;
    }

    set({ incomingCall: data, isCaller: false });

    // Show native incoming call UI via CallKeep
    import('../services/CallKeepService').then(({ CallKeepService }) => {
      CallKeepService.displayIncomingCall(
        data.callerInfo?._id || data.from,
        data.callerInfo?.fullName || 'Incoming Call',
        data.callType === 'video',
      );
    });
  },

  handleCallAcceptedByPeer: async ({ answer }) => {
    if (!peerConnection) return;
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer as any));
      const { outgoingCall } = get();
      if (outgoingCall) {
        set({
          activeCall: { with: outgoingCall.to._id, callType: outgoingCall.callType, callerInfo: outgoingCall.to as any },
          callStartTime: Date.now(), outgoingCall: null,
        });
      }
    } catch (err) {
      console.error('[CallStore] handleCallAcceptedByPeer error:', err);
    }
  },

  handleIceCandidate: async ({ candidate }) => {
    if (!candidate) return;
    if (peerConnection && peerConnection.remoteDescription) {
      try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    } else {
      set((state) => ({ pendingIceQueue: [...state.pendingIceQueue, candidate] }));
    }
  },

  handleCallRejected: () => { get().cleanup(); },
  handleCallEnded: () => { get().cleanup(); },
  handleCallTimeout: () => { get().cleanup(); },
  handleUserOffline: () => { get().cleanup(); },
}));
