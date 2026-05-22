/**
 * FCM Push Notification Service
 *
 * Handles:
 * - Requesting notification permission
 * - Registering FCM token with backend
 * - Handling foreground/background/quit message handling
 * - Displaying local notifications for messages
 *
 * Requires: google-services.json in android/app/ for Android
 *           GoogleService-Info.plist in ios/ for iOS
 */

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

let _apiClient: any = null;

const getApiClient = async () => {
  if (!_apiClient) {
    const { apiClient } = await import('../store/useAuthStore');
    _apiClient = apiClient;
  }
  return _apiClient;
};

export const NotificationService = {
  /**
   * Call once at app start (index.js).
   * Sets up background message handler before React renders.
   */
  configure() {
    // ── Background message handler ─────────────────────────────────────
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[FCM] Background message:', remoteMessage.messageId);
      // Background messages are handled by the OS notification system.
      // For call notifications, CallKeepService handles the native UI.
    });
  },

  /**
   * Request notification permission (iOS requires explicit request).
   * Call after user is authenticated.
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') return true; // Android auto-grants on modern versions

    const authStatus = await messaging().requestPermission();
    return [
      messaging.AuthorizationStatus.AUTHORIZED,
      messaging.AuthorizationStatus.PROVISIONAL,
    ].includes(authStatus);
  },

  /**
   * Get FCM token and register it with the backend.
   * Must be called after login/checkAuth.
   */
  async registerToken(userId: string): Promise<void> {
    try {
      const token = await messaging().getToken();
      if (!token) return;

      console.log('[FCM] Token:', token.substring(0, 20) + '...');

      const client = await getApiClient();
      await client.post('/auth/fcm-token', { token, platform: Platform.OS });

      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken) => {
        await client.post('/auth/fcm-token', { token: newToken, platform: Platform.OS });
      });
    } catch (err) {
      console.error('[FCM] Token registration failed:', err);
    }
  },

  /**
   * Subscribe to foreground messages (app is open).
   * Returns unsubscribe function.
   */
  subscribeToForegroundMessages(onMessage: (msg: any) => void): () => void {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('[FCM] Foreground message:', remoteMessage.data);
      onMessage(remoteMessage);
    });
  },

  /**
   * Handle notification taps (app opened from background).
   */
  onNotificationOpenedApp(handler: (msg: any) => void) {
    messaging().onNotificationOpenedApp(handler);

    // Check if app was opened from a quit state notification
    messaging().getInitialNotification().then((msg) => {
      if (msg) handler(msg);
    });
  },
};
