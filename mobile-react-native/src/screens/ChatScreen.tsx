/**
 * React Native Chat Screen
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useCallStore } from '../store/useCallStore';
import { formatMessageTime } from '../utils/dateUtils';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { Message } from '@chatty/shared-core';
import { useAppTheme } from '../hooks/useAppTheme';
import { ChatBackground } from '../components/ChatBackground';

type Props = {
  navigation: StackNavigationProp<any>;
  route: any;
};

export default function ChatScreen({ navigation, route }: Props) {
  const { theme, chatPattern } = useAppTheme();
  const styles = getStyles(theme);
  const user = route.params?.user;
  const { authUser, onlineUsers } = useAuthStore();
  const { messages, sendMessage, isSendingMessage, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { startCall } = useCallStore();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const isOnline = onlineUsers.includes(user?._id);

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || isSendingMessage) return;
    const msg = text.trim();
    setText('');
    await sendMessage({ text: msg });
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isSent = item.senderId === authUser?._id;
    return (
      <View style={[styles.msgRow, isSent ? styles.msgRowSent : styles.msgRowReceived]}>
        {!isSent && (
          <Image source={{ uri: user?.profilePic || 'https://via.placeholder.com/32' }} style={styles.msgAvatar} />
        )}
        <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
          {item.isDeletedForEveryone
            ? <Text style={[styles.bubbleText, { fontStyle: 'italic', opacity: 0.6 }]}>🚫 Message deleted</Text>
            : item.image
              ? <Image source={{ uri: item.image }} style={styles.msgImage} />
              : <Text style={[styles.bubbleText, isSent && styles.bubbleTextSent]}>{item.text}</Text>
          }
          <Text style={[styles.timeText, isSent && styles.timeTextSent]}>
            {formatMessageTime(item.createdAt)}
            {isSent && ` ${item.status === 'seen' ? '✓✓' : item.status === 'delivered' ? '✓✓' : '✓'}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Image source={{ uri: user?.profilePic || 'https://via.placeholder.com/40' }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{user?.fullName}</Text>
          <Text style={[styles.headerStatus, isOnline && styles.headerStatusOnline]}>
            {isOnline ? '● Online' : '● Offline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={() => { startCall(user, 'audio'); navigation.navigate('Call'); }}>
          <Text style={{ fontSize: 20 }}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callBtn} onPress={() => { startCall(user, 'video'); navigation.navigate('Call'); }}>
          <Text style={{ fontSize: 20 }}>📹</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ChatBackground patternName={chatPattern} opacity={0.1} />
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${user?.fullName}...`}
            placeholderTextColor={theme.colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isSendingMessage}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.header, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  backBtn: { padding: theme.spacing.xs },
  backIcon: { 
    fontSize: theme.typography.sizes.xxl, 
    color: theme.colors.primary, 
    lineHeight: 32 
  },
  headerAvatar: { width: 40, height: 40, borderRadius: theme.radii.avatar },
  headerInfo: { flex: 1 },
  headerName: { 
    fontSize: theme.typography.sizes.md, 
    fontWeight: theme.typography.weights.semibold as any, 
    color: theme.colors.textMain 
  },
  headerStatus: { fontSize: theme.typography.sizes.xs, color: theme.colors.textMuted, marginTop: 1 },
  headerStatusOnline: { color: theme.colors.online },
  callBtn: { padding: theme.spacing.xs },
  msgRow: { flexDirection: 'row', marginVertical: theme.spacing.xs, alignItems: 'flex-end', gap: theme.spacing.sm },
  msgRowSent: { justifyContent: 'flex-end' },
  msgRowReceived: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: theme.radii.avatar, marginBottom: 2 },
  bubble: { maxWidth: '72%', padding: theme.spacing.sm + 2, borderRadius: theme.radii.bubble, gap: 3 },
  bubbleSent: {
    backgroundColor: theme.colors.sentBubble, borderBottomRightRadius: theme.radii.xs,
    ...theme.shadows.sm,
  },
  bubbleReceived: { 
    backgroundColor: theme.colors.receivedBubble, 
    borderBottomLeftRadius: theme.radii.xs, 
    borderWidth: 1, borderColor: theme.colors.border 
  },
  bubbleText: { fontSize: theme.typography.sizes.sm, color: theme.colors.textMain, lineHeight: 20 },
  bubbleTextSent: { color: theme.colors.textLight },
  msgImage: { width: 200, height: 150, borderRadius: theme.radii.sm },
  timeText: { fontSize: theme.typography.sizes.xs, color: theme.colors.textMuted, alignSelf: 'flex-end' },
  timeTextSent: { color: 'rgba(255,255,255,0.6)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.header, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1, backgroundColor: theme.colors.input, borderRadius: theme.radii.xl,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm + 2,
    color: theme.colors.textMain, fontSize: theme.typography.sizes.sm, maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...theme.shadows.glow,
  },
  sendBtnDisabled: { backgroundColor: theme.colors.border, shadowOpacity: 0 },
  sendIcon: { fontSize: 18, color: theme.colors.white },
});
