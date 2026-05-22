/**
 * React Native Profile Screen
 */
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemeStore } from '../store/useThemeStore';
import { theme as baseTheme, themesList, ThemeName } from '@chatty/shared-core';

type Props = { navigation: any };

export default function ProfileScreen({ navigation }: Props) {
  const { authUser, logout } = useAuthStore();
  const { theme, activeTheme, chatPattern } = useAppTheme();
  const styles = getStyles(theme);
  const { setTheme, setChatPattern } = useThemeStore();
  
  const THEMES = Object.keys(themesList) as ThemeName[];
  const PATTERNS = ['none', 'whatsapp', 'dots', 'grid', 'squares', 'cubes', 'diagonal', 'zigzag', 'circles', 'cross', 'lines', 'triangles'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: authUser?.profilePic || 'https://via.placeholder.com/90' }}
              style={styles.avatar}
            />
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.name}>{authUser?.fullName}</Text>
          <Text style={styles.email}>{authUser?.email}</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>● Active</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={{ gap: baseTheme.spacing.md }}>
          {[
            { icon: '👤', label: 'Edit Profile', sub: 'Update name, photo, about' },
            { icon: '🔔', label: 'Notifications', sub: 'Sounds, popups, DND' },
            { icon: '🔒', label: 'Privacy', sub: 'Profile photo visibility' },
            { icon: '📱', label: 'Linked Devices', sub: 'Manage active sessions' },
          ].map(({ icon, label, sub }) => (
            <TouchableOpacity key={label} style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuEmoji}>{icon}</Text>
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{label}</Text>
                <Text style={styles.menuSub}>{sub}</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionSub}>Choose a color theme for your interface</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeScroll}>
            {THEMES.map(t => {
              const isActive = activeTheme === t;
              const tc = themesList[t];
              return (
                <TouchableOpacity key={t} style={[styles.themeCard, isActive && styles.themeCardActive]} onPress={() => setTheme(t)}>
                  <View style={styles.themePalette}>
                    <View style={[styles.colorBlock, { backgroundColor: tc.primary }]} />
                    <View style={[styles.colorBlock, { backgroundColor: tc.sidebar }]} />
                    <View style={[styles.colorBlock, { backgroundColor: tc.textMain }]} />
                    <View style={[styles.colorBlock, { backgroundColor: tc.error }]} />
                  </View>
                  <Text style={[styles.themeName, isActive && { color: theme.colors.primary }]}>{t}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Chat Pattern Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Chat Background</Text>
          <Text style={styles.sectionSub}>Choose a pattern to overlay on your chats</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeScroll}>
            {PATTERNS.map(p => {
              const isActive = chatPattern === p;
              return (
                <TouchableOpacity key={p} style={[styles.patternCard, isActive && styles.themeCardActive]} onPress={() => setChatPattern(p)}>
                  <View style={styles.patternPreview}>
                    <Text style={styles.patternIcon}>{p === 'whatsapp' ? '🟢' : p === 'none' ? '🚫' : '🎨'}</Text>
                  </View>
                  <Text style={[styles.themeName, isActive && { color: theme.colors.primary }]}>{p}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: baseTheme.spacing.lg, 
    paddingVertical: baseTheme.spacing.md, 
    backgroundColor: theme.colors.header, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border 
  },
  backBtn: { padding: baseTheme.spacing.xs, width: 40 },
  backIcon: { fontSize: baseTheme.typography.sizes.xxl, color: theme.colors.primary, lineHeight: 32 },
  headerTitle: { 
    fontSize: baseTheme.typography.sizes.lg, 
    fontWeight: baseTheme.typography.weights.semibold as any, 
    color: theme.colors.textMain 
  },
  content: { padding: baseTheme.spacing.xl, gap: baseTheme.spacing.md },
  avatarSection: { alignItems: 'center', paddingVertical: baseTheme.spacing.xxl, gap: baseTheme.spacing.xs + 2 },
  avatarWrapper: { position: 'relative', marginBottom: baseTheme.spacing.xs },
  avatar: { 
    width: 90, 
    height: 90, 
    borderRadius: baseTheme.radii.avatar, 
    borderWidth: 3, 
    borderColor: theme.colors.primary 
  },
  onlineDot: { 
    position: 'absolute', 
    bottom: baseTheme.spacing.xs, 
    right: baseTheme.spacing.xs, 
    width: 16, 
    height: 16, 
    borderRadius: baseTheme.radii.avatar, 
    backgroundColor: theme.colors.online, 
    borderWidth: 3, 
    borderColor: theme.colors.background 
  },
  name: { 
    fontSize: baseTheme.typography.sizes.xl, 
    fontWeight: baseTheme.typography.weights.bold as any, 
    color: theme.colors.textMain 
  },
  email: { fontSize: baseTheme.typography.sizes.sm, color: theme.colors.textMuted },
  activeBadge: { 
    backgroundColor: 'rgba(74,222,128,0.15)', 
    borderRadius: baseTheme.radii.xl, 
    paddingHorizontal: baseTheme.spacing.md, 
    paddingVertical: baseTheme.spacing.xs, 
    borderWidth: 1, 
    borderColor: 'rgba(74,222,128,0.3)', 
    marginTop: baseTheme.spacing.xs 
  },
  activeBadgeText: { 
    color: theme.colors.success, 
    fontSize: baseTheme.typography.sizes.xs, 
    fontWeight: baseTheme.typography.weights.semibold as any 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: baseTheme.spacing.lg, 
    backgroundColor: theme.colors.header, 
    borderRadius: baseTheme.radii.lg, 
    padding: baseTheme.spacing.lg, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  menuIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: baseTheme.radii.md, 
    backgroundColor: 'rgba(0, 168, 132, 0.15)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  menuEmoji: { fontSize: 18 },
  menuInfo: { flex: 1 },
  menuLabel: { 
    fontSize: baseTheme.typography.sizes.md, 
    fontWeight: baseTheme.typography.weights.semibold as any, 
    color: theme.colors.textMain 
  },
  menuSub: { fontSize: baseTheme.typography.sizes.sm, color: theme.colors.textMuted, marginTop: 2 },
  menuChevron: { fontSize: baseTheme.typography.sizes.xl, color: theme.colors.textMuted },
  sectionContainer: {
    backgroundColor: theme.colors.header,
    borderRadius: baseTheme.radii.lg,
    padding: baseTheme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: baseTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: baseTheme.typography.sizes.md,
    fontWeight: baseTheme.typography.weights.bold as any,
    color: theme.colors.textMain,
  },
  sectionSub: {
    fontSize: baseTheme.typography.sizes.sm,
    color: theme.colors.textMuted,
    marginBottom: baseTheme.spacing.md,
  },
  themeScroll: { gap: 12, paddingVertical: 8 },
  themeCard: {
    width: 70, alignItems: 'center', gap: 8, padding: 6,
    borderRadius: baseTheme.radii.md, borderWidth: 2, borderColor: 'transparent',
  },
  themeCardActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(255,255,255,0.05)' },
  themePalette: {
    width: 50, height: 50, borderRadius: baseTheme.radii.sm,
    flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  colorBlock: { width: 25, height: 25 },
  themeName: { fontSize: 10, color: theme.colors.textMuted, textTransform: 'capitalize' },
  patternCard: {
    width: 80, alignItems: 'center', gap: 8, padding: 6,
    borderRadius: baseTheme.radii.md, borderWidth: 2, borderColor: 'transparent',
  },
  patternPreview: {
    width: 60, height: 60, borderRadius: baseTheme.radii.sm, backgroundColor: theme.colors.input,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border,
  },
  patternIcon: { fontSize: 24 },
  logoutBtn: { 
    backgroundColor: 'rgba(248,113,113,0.12)', 
    borderRadius: baseTheme.radii.lg, 
    paddingVertical: baseTheme.spacing.lg, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(248,113,113,0.3)', 
    marginTop: baseTheme.spacing.xl 
  },
  logoutText: { 
    color: theme.colors.error, 
    fontSize: baseTheme.typography.sizes.md, 
    fontWeight: baseTheme.typography.weights.semibold as any 
  },
});
