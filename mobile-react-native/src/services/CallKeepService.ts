/**
 * CallKeep Service
 *
 * Provides native incoming call UI:
 * - iOS: CallKit (looks like a real phone call)
 * - Android: ConnectionService (full-screen incoming call)
 *
 * Integrates with react-native-callkeep.
 */

import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import uuid from 'react-native-uuid';

let _currentCallUUID: string | null = null;

export const CallKeepService = {
  /**
   * Call at app startup (index.js) before React renders.
   */
  setup() {
    const options: any = {
      ios: {
        appName: 'Chatty',
        supportsVideo: true,
        maximumCallGroups: '1',
        maximumCallsPerCallGroup: '1',
      },
      android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts to make and receive calls.',
        cancelButton: 'Cancel',
        okButton: 'OK',
        imageName: 'ic_launcher',
        additionalPermissions: [],
        foregroundService: {
          channelId: 'com.chatty.call',
          channelName: 'Chatty Calls',
          notificationTitle: 'Chatty is active',
          notificationIcon: 'ic_launcher',
        },
      },
    };

    try {
      RNCallKeep.setup(options);
      RNCallKeep.setAvailable(true);
    } catch (err) {
      console.error('[CallKeep] Setup failed:', err);
    }

    // ── Event listeners ────────────────────────────────────────────────
    RNCallKeep.addEventListener('answerCall', ({ callUUID }: { callUUID: string }) => {
      console.log('[CallKeep] Answer:', callUUID);
      import('../store/useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().acceptCall();
      });
      RNCallKeep.endCall(callUUID);
    });

    RNCallKeep.addEventListener('endCall', ({ callUUID }: { callUUID: string }) => {
      console.log('[CallKeep] End:', callUUID);
      import('../store/useCallStore').then(({ useCallStore }) => {
        useCallStore.getState().rejectCall();
      });
    });
  },

  /**
   * Display native incoming call UI.
   * Shows the system-level call screen (iOS CallKit / Android full-screen).
   */
  displayIncomingCall(callerId: string, callerName: string, hasVideo: boolean) {
    _currentCallUUID = uuid.v4() as string;

    RNCallKeep.displayIncomingCall(
      _currentCallUUID,
      callerId,
      callerName,
      'generic',
      hasVideo,
    );
  },

  /**
   * End all active CallKeep calls (call ended/rejected).
   */
  endAllCalls() {
    if (_currentCallUUID) {
      RNCallKeep.endCall(_currentCallUUID);
      _currentCallUUID = null;
    }
    RNCallKeep.endAllCalls();
  },
};
