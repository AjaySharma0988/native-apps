import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const getSocketURL = () => {
  if (window.electronAPI && window.electronAPI.env) {
    return window.electronAPI.env.VITE_SOCKET_URL;
  }
  return import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
};

const BASE_URL = getSocketURL();

let onlineHandler = null;
let powerResumeCleanup = null;

const SAFE_USER_FIELDS = ["_id", "fullName", "email", "profilePic", "about", "privacy", "deletionScheduledAt", "notificationSettings"];
const persistUser = async (user) => {
  const safe = {};
  for (const key of SAFE_USER_FIELDS) {
    if (user[key] !== undefined) safe[key] = user[key];
  }
  if (window.electronAPI) {
    await window.electronAPI.storeSet("chatty_user", safe);
  }
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  linkedDevices: [],
  totalActiveSessions: 0,
  isFetchingDevices: false,
  socket: null,

  checkAuth: async () => {
    if (window.electronAPI) {
      const cachedUser = await window.electronAPI.storeGet("chatty_user");
      if (cachedUser) {
        set({ authUser: cachedUser });
        get().connectSocket();
      }
    }

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      await persistUser(res.data);
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      if (error.response && error.response.status === 401) {
        set({ authUser: null });
        if (window.electronAPI) await window.electronAPI.storeDelete("chatty_user");
      } else {
        get().connectSocket();
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      if (window.electronAPI && res.data.token) {
        await window.electronAPI.storeSet("jwt", res.data.token);
      }
      await persistUser(res.data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      if (window.electronAPI && res.data.token) {
        await window.electronAPI.storeSet("jwt", res.data.token);
      }
      await persistUser(res.data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      if (window.electronAPI) {
        await window.electronAPI.storeDelete("chatty_user");
        await window.electronAPI.storeDelete("jwt");
      }
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      await persistUser(res.data);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updatePrivacy: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/privacy", data);
      set({ authUser: res.data });
      await persistUser(res.data);
      toast.success("Privacy settings saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save privacy settings");
    }
  },

  updateNotifications: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/notifications", data);
      set({ authUser: res.data });
      await persistUser(res.data);
      toast.success("Notification settings saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save notification settings");
    }
  },

  deleteAccount: async () => {
    try {
      await axiosInstance.delete("/auth/delete-account");
      set({ authUser: null });
      if (window.electronAPI) {
        await window.electronAPI.storeDelete("chatty_user");
        await window.electronAPI.storeDelete("jwt");
      }
      get().disconnectSocket();
      toast.success("Account scheduled for deletion.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    }
  },

  restoreAccount: async () => {
    try {
      await axiosInstance.post("/auth/restore-account");
      const updatedUser = { ...get().authUser, deletionScheduledAt: null };
      set({ authUser: updatedUser });
      await persistUser(updatedUser);
      toast.success("Account restored successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore account");
    }
  },

  fetchLinkedDevices: async () => {
    set({ isFetchingDevices: true });
    try {
      const res = await axiosInstance.get("/auth/linked-devices");
      set({ 
        linkedDevices: res.data.sessions, 
        totalActiveSessions: res.data.totalActive 
      });
    } catch (error) {
      console.log("Error in fetchLinkedDevices:", error);
    } finally {
      set({ isFetchingDevices: false });
    }
  },

  removeSession: async (sessionId) => {
    try {
      await axiosInstance.delete(`/auth/linked-devices/${sessionId}`);
      set((state) => ({
        linkedDevices: state.linkedDevices.filter((d) => d.sessionId !== sessionId),
        totalActiveSessions: Math.max(0, state.totalActiveSessions - 1)
      }));
      toast.success("Session removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove session");
    }
  },

  connectSocket: async () => {
    const { authUser, socket } = get();
    if (!authUser || socket) return;

    let token = null;
    if (window.electronAPI) {
      token = await window.electronAPI.storeGet("jwt");
    }

    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });
    newSocket.connect();
    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log(`[Socket:Electron:DEBUG] Socket connected with ID: ${newSocket.id}`);
      
      // Re-register connection on server to ensure online status is broadcasted
      newSocket.emit("force:sync:presence");

      import("./useChatStore").then(({ useChatStore }) => {
        const chatStore = useChatStore.getState();
        chatStore.syncPendingMessages?.();
        chatStore.subscribeToGlobalEvents();
        chatStore.subscribeToMessages();
        
        // Recover any missed messages and offline state updates
        chatStore.getUsers();
        if (chatStore.selectedUser) {
          chatStore.getMessages(chatStore.selectedUser._id);
        }
      });
      import("./useStatusStore").then(({ useStatusStore }) => {
        useStatusStore.getState().subscribeToStatuses();
      });
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log(`[Socket:Electron:DEBUG] Received getOnlineUsers. Count: ${userIds.length}`);
      set({ onlineUsers: userIds });
    });

    newSocket.on("call:incoming-group", (data) => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleIncomingCall({ ...data, isGroupCall: true, callType: "video" });
      });
    });

    newSocket.on("incoming-call", (data) => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleIncomingCall(data);
      });
    });

    newSocket.on("call-accepted-by-peer", (data) => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleCallAcceptedByPeer(data);
      });
    });

    newSocket.on("ice-candidate", (data) => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleIceCandidate(data);
      });
    });

    newSocket.on("call-rejected", () => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleCallRejected();
        toast.error("Call was declined.", { id: "call-rejected" });
      });
    });

    newSocket.on("call-ended", () => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleCallEnded();
        toast("Call ended by the other person", { icon: "📞", id: "call-ended" });
      });
    });

    newSocket.on("call:ended", ({ reason }) => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleCallEnded({ reason });
        toast("Call ended", { icon: "📞", id: "call:ended" });
      });
    });

    newSocket.on("call-timeout", () => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleCallTimeout();
        toast("No answer", { icon: "📵", id: "call-timeout" });
      });
    });

    newSocket.on("call-user-offline", () => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().handleUserOffline();
        toast.error("User is offline. Try again later.", { id: "call-offline" });
      });
    });

    newSocket.on("callHistoryUpdated", () => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().fetchCallHistory();
      });
    });

    newSocket.on("session:added", (session) => {
      set((state) => {
        const exists = state.linkedDevices.find(d => d.sessionId === session.sessionId);
        if (exists) return state;
        return {
          linkedDevices: [session, ...state.linkedDevices],
          totalActiveSessions: state.totalActiveSessions + 1
        };
      });
    });

    newSocket.on("session:removed", (sessionId) => {
      set((state) => ({
        linkedDevices: state.linkedDevices.filter(d => d.sessionId !== sessionId),
        totalActiveSessions: Math.max(0, state.totalActiveSessions - 1)
      }));
    });

    newSocket.on("session:terminated", async ({ message }) => {
      set({ authUser: null });
      if (window.electronAPI) {
        await window.electronAPI.storeDelete("chatty_user");
        await window.electronAPI.storeDelete("jwt");
      }
      get().disconnectSocket();
      toast.error(message || "Your session has been terminated.", { id: "session-terminated", duration: 5000 });
    });

    // Network recovery listener
    if (!onlineHandler) {
      onlineHandler = () => {
        const { socket } = get();
        if (socket && !socket.connected) {
          console.log("[Socket] Browser online, reconnecting socket...");
          socket.connect();
        } else if (socket && socket.connected) {
          console.log(`[Socket:Electron:DEBUG] Window focus/wake event detected. Emitting force:sync:presence`);
          socket.emit("force:sync:presence");
        }
      };
      window.addEventListener("online", onlineHandler);
      window.addEventListener("focus", onlineHandler);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") onlineHandler();
      });
    }

    // Power resume (Electron only)
    if (window.electronAPI?.app?.onPowerResume && !powerResumeCleanup) {
      powerResumeCleanup = window.electronAPI.app.onPowerResume(() => {
        const { socket } = get();
        if (socket && !socket.connected) {
          console.log("[Socket] System woke up, reconnecting socket...");
          socket.connect();
        } else if (socket && socket.connected) {
          console.log(`[Socket:Electron:DEBUG] System woke up. Emitting force:sync:presence`);
          socket.emit("force:sync:presence");
        }
      });
    }
  },

  disconnectSocket: () => {
    if (onlineHandler) {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("focus", onlineHandler);
      onlineHandler = null;
    }
    if (powerResumeCleanup) {
      powerResumeCleanup();
      powerResumeCleanup = null;
    }
    if (get().socket?.connected) get().socket.disconnect();
    set({ socket: null });
  },
}));
