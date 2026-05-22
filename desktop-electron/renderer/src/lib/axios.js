import axios from "axios";

const getBaseURL = () => {
  if (window.electronAPI && window.electronAPI.env) {
    return window.electronAPI.env.VITE_API_URL;
  }
  return import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";
};

export const axiosInstance = axios.create({
  baseURL: getBaseURL(),
});

// Attach Bearer token to every request since Electron doesn't reliably use httpOnly cookies across domains
axiosInstance.interceptors.request.use(async (config) => {
  if (window.electronAPI) {
    const token = await window.electronAPI.storeGet('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { useAuthStore } = await import("../store/useAuthStore.js");
        const { authUser, disconnectSocket } = useAuthStore.getState();

        if (authUser) {
          useAuthStore.setState({ authUser: null });
          if (window.electronAPI) {
            await window.electronAPI.storeDelete("jwt");
            await window.electronAPI.storeDelete("chatty_user");
          }
          disconnectSocket();
        }
      } catch {
        if (window.electronAPI) {
          await window.electronAPI.storeDelete("jwt");
          await window.electronAPI.storeDelete("chatty_user");
        }
      }
    }
    return Promise.reject(error);
  }
);
