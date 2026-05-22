/**
 * React Native Call Screen
 *
 * Uses react-native-webrtc RTCView for rendering video streams.
 * Supports both audio-only and video calls.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useCallStore } from '../store/useCallStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../hooks/useAppTheme';

type Props = { navigation: StackNavigationProp<any> };

export default function CallScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = getStyles(theme);
  const {
    activeCall, outgoingCall, localStream, remoteStream,
    isMuted, isCameraOff, callStartTime,
    endCall, toggleMute, toggleCamera, switchCamera,
  } = useCallStore();

  const [duration, setDuration] = useState(0);
  const peerName = activeCall?.callerInfo?.fullName ?? (outgoingCall?.to?.fullName ?? 'Calling...');
  const peerPic = activeCall?.callerInfo?.profilePic ?? outgoingCall?.to?.profilePic;
  const callType = activeCall?.callType ?? outgoingCall?.callType ?? 'audio';

  useEffect(() => {
    const interval = callStartTime
      ? setInterval(() => setDuration(Math.floor((Date.now() - callStartTime) / 1000)), 1000)
      : undefined;
    return () => clearInterval(interval);
  }, [callStartTime]);

  const handleEnd = async () => {
    await endCall();
    navigation.goBack();
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      {/* Remote video */}
      {callType === 'video' && remoteStream ? (
        <RTCView
          streamURL={(remoteStream as any).toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.audioBackground}>
          {peerPic
            ? <Image source={{ uri: peerPic }} style={styles.peerAvatar} />
            : <View style={[styles.peerAvatar, { backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 40, color: theme.colors.white }}>{peerName[0]}</Text>
              </View>
          }
          <Text style={styles.peerName}>{peerName}</Text>
          <Text style={styles.callStatus}>
            {callStartTime ? formatDuration(duration) : (outgoingCall ? 'Calling...' : 'Connecting...')}
          </Text>
        </View>
      )}

      {/* Local video PiP */}
      {callType === 'video' && localStream && !isCameraOff && (
        <RTCView
          streamURL={(localStream as any).toURL()}
          style={styles.localVideo}
          objectFit="cover"
          mirror={true}
          zOrder={1}
        />
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
          onPress={toggleMute}
        >
          <Text style={styles.ctrlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
        </TouchableOpacity>

        {callType === 'video' && (
          <TouchableOpacity
            style={[styles.ctrlBtn, isCameraOff && styles.ctrlBtnActive]}
            onPress={toggleCamera}
          >
            <Text style={styles.ctrlIcon}>{isCameraOff ? '📵' : '📹'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.endBtn} onPress={handleEnd}>
          <Text style={styles.endBtnIcon}>📵</Text>
        </TouchableOpacity>

        {callType === 'video' && (
          <TouchableOpacity style={styles.ctrlBtn} onPress={switchCamera}>
            <Text style={styles.ctrlIcon}>🔄</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.sidebar },
  remoteVideo: { position: 'absolute', inset: 0, flex: 1 } as any,
  audioBackground: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  peerAvatar: { width: 100, height: 100, borderRadius: theme.radii.avatar, marginBottom: theme.spacing.sm },
  peerName: { 
    fontSize: theme.typography.sizes.xl, 
    fontWeight: theme.typography.weights.bold as any, 
    color: theme.colors.textMain 
  },
  callStatus: { 
    fontSize: theme.typography.sizes.sm, 
    color: theme.colors.textMuted 
  },
  localVideo: {
    position: 'absolute', bottom: 120, right: 16,
    width: 100, height: 140, borderRadius: theme.radii.lg,
    overflow: 'hidden', zIndex: 10,
    borderWidth: 2, borderColor: theme.colors.border,
  },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingBottom: 40, paddingTop: 20, gap: theme.spacing.xl,
    backgroundColor: theme.colors.overlay,
  },
  ctrlBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlBtnActive: { backgroundColor: 'rgba(255,255,255,0.85)' },
  ctrlIcon: { fontSize: 22 },
  endBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.colors.error,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: theme.colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
    elevation: 8,
  },
  endBtnIcon: { fontSize: 26, transform: [{ rotate: '135deg' }] },
});
