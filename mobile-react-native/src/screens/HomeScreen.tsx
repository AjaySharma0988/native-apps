/**
 * React Native Home Screen — chat list
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { formatMessageTime } from '../utils/dateUtils';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ChatUser } from '@chatty/shared-core';
import { useAppTheme } from '../hooks/useAppTheme';

type Props = { navigation: StackNavigationProp<any> };

export default function HomeScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = getStyles(theme);
  const { authUser, onlineUsers } = useAuthStore();
  const { users, isUsersLoading, getUsers, setSelectedUser } = useChatStore();
  const [search, setSearch] = useState('');

  useEffect(() => { getUsers(); }, []);

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: ChatUser }) => {
    const isOnline = onlineUsers.includes(item._id);
    return (
      <TouchableOpacity
        style={styles.userItem}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedUser(item);
          navigation.navigate('Chat', { user: item });
        }}
      >
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: item.profilePic || 'https://via.placeholder.com/44' }} style={styles.avatar} />
          {isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userPreview} numberOfLines={1}>
            {item.lastMessage?.text || (item.lastMessage?.image ? '📷 Photo' : 'Say hello!')}
          </Text>
        </View>
        <View style={styles.userMeta}>
          {item.lastMessage && (
            <Text style={styles.time}>{formatMessageTime(item.lastMessage.createdAt)}</Text>
          )}
          {(item.unreadCount ?? 0) > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount! > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}><Text style={{ fontSize: 18 }}>💬</Text></View>
          <Text style={styles.headerTitle}>Chatty</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image source={{ uri: authUser?.profilePic || 'https://via.placeholder.com/36' }} style={styles.profilePic} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      {isUsersLoading
        ? <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
        : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : { paddingBottom: 20 }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>No conversations yet</Text>
                <Text style={styles.emptySubText}>Start by finding a contact</Text>
              </View>
            }
          />
        )
      }
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.header,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 34, height: 34, borderRadius: theme.radii.sm, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { 
    fontSize: theme.typography.sizes.lg, 
    fontWeight: theme.typography.weights.bold as any, 
    color: theme.colors.textMain 
  },
  profilePic: { width: 36, height: 36, borderRadius: 18 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: theme.spacing.md, backgroundColor: theme.colors.input,
    borderRadius: theme.radii.sm, borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: { fontSize: theme.typography.sizes.sm, marginRight: theme.spacing.sm },
  searchInput: { 
    flex: 1, paddingVertical: 10, 
    color: theme.colors.textMain, 
    fontSize: theme.typography.sizes.sm 
  },
  userItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md, gap: theme.spacing.md,
  },
  avatar: { width: 50, height: 50, borderRadius: theme.radii.avatar },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: theme.colors.online, borderWidth: 2, borderColor: theme.colors.background,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { 
    fontWeight: theme.typography.weights.semibold as any, 
    fontSize: theme.typography.sizes.md, 
    color: theme.colors.textMain, 
    marginBottom: 3 
  },
  userPreview: { fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted },
  userMeta: { alignItems: 'flex-end', gap: theme.spacing.xs },
  time: { fontSize: theme.typography.sizes.xs, color: theme.colors.textMuted },
  badge: {
    backgroundColor: theme.colors.activeBadge, borderRadius: theme.radii.sm,
    paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center',
  },
  badgeText: { 
    color: '#fff', 
    fontSize: theme.typography.sizes.xs, 
    fontWeight: theme.typography.weights.bold as any 
  },
  separator: { height: 1, backgroundColor: theme.colors.border, marginHorizontal: theme.spacing.lg },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: theme.spacing.sm },
  emptyIcon: { fontSize: 48, marginBottom: theme.spacing.sm },
  emptyText: { 
    fontSize: theme.typography.sizes.lg, 
    fontWeight: theme.typography.weights.bold as any, 
    color: theme.colors.textMain 
  },
  emptySubText: { fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted },
});
