/**
 * Incoming Call Overlay — shown on any screen when a call arrives
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { useCallStore } from '../store/useCallStore';
import { theme } from '@chatty/shared-core';

export default function IncomingCallOverlay() {
  const { incomingCall, acceptCall, rejectCall } = useCallStore();
  if (!incomingCall) return null;

  const { callerInfo, callType } = incomingCall;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.callerRow}>
          <Image
            source={{ uri: callerInfo?.profilePic || 'https://via.placeholder.com/48' }}
            style={styles.avatar}
          />
          <View style={styles.callerInfo}>
            <Text style={styles.callerName}>{callerInfo?.fullName || 'Unknown'}</Text>
            <Text style={styles.callTypeText}>
              {callType === 'video' ? '📹' : '📞'} Incoming {callType} call
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={rejectCall} activeOpacity={0.8}>
            <Text style={styles.rejectIcon}>📵</Text>
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptCall()} activeOpacity={0.8}>
            <Text style={styles.acceptIcon}>📞</Text>
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: theme.colors.overlay, zIndex: 9999,
    justifyContent: 'flex-start', alignItems: 'center',
    paddingTop: 60,
  },
  card: {
    backgroundColor: theme.colors.header, borderRadius: 20, padding: 20,
    width: '88%', borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20,
    elevation: 20,
  },
  callerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: theme.colors.primary },
  callerInfo: { flex: 1 },
  callerName: { fontSize: 18, fontWeight: '700', color: theme.colors.textMain },
  callTypeText: { fontSize: 13, color: theme.colors.textMuted, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 12 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 14,
    backgroundColor: 'rgba(248,113,113,0.15)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  rejectIcon: { fontSize: 16 },
  rejectText: { color: '#f87171', fontSize: 14, fontWeight: '600' },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 14,
    backgroundColor: theme.colors.success,
    shadowColor: theme.colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  acceptIcon: { fontSize: 16 },
  acceptText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
