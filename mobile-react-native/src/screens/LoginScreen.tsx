/**
 * React Native Login Screen
 * Uses View/Text/StyleSheet — NO HTML/CSS
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../hooks/useAppTheme';

type Props = { navigation: StackNavigationProp<any> };

export default function LoginScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = getStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    await login({ email: email.trim(), password });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>💬</Text>
            </View>
            <Text style={styles.logoTitle}>Chatty</Text>
            <Text style={styles.logoSub}>Connect. Call. Chat.</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, isLoggingIn && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
              activeOpacity={0.8}
            >
              {isLoggingIn
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Sign In</Text>
              }
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.switchLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xxl },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: theme.radii.bubble,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.glow,
  },
  logoEmoji: { fontSize: 30 },
  logoTitle: { 
    fontSize: theme.typography.sizes.xxl, 
    fontWeight: theme.typography.weights.bold as any, 
    color: theme.colors.textMain, 
    letterSpacing: -0.5 
  },
  logoSub: { 
    fontSize: theme.typography.sizes.sm, 
    color: theme.colors.textMuted, 
    marginTop: theme.spacing.xs 
  },
  card: {
    backgroundColor: theme.colors.header,
    borderRadius: theme.radii.xl, 
    padding: theme.spacing.xxl,
    borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  cardTitle: { 
    fontSize: theme.typography.sizes.xl, 
    fontWeight: theme.typography.weights.bold as any, 
    color: theme.colors.textMain, 
    marginBottom: theme.spacing.xs 
  },
  cardSub: { 
    fontSize: theme.typography.sizes.sm, 
    color: theme.colors.textMuted, 
    marginBottom: theme.spacing.xxl 
  },
  inputGroup: { marginBottom: theme.spacing.lg },
  label: { 
    fontSize: theme.typography.sizes.sm, 
    color: theme.colors.textMuted, 
    fontWeight: theme.typography.weights.semibold as any, 
    marginBottom: 6 
  },
  input: {
    backgroundColor: theme.colors.input, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radii.md, paddingHorizontal: 14, paddingVertical: 12,
    color: theme.colors.textMain, fontSize: theme.typography.sizes.md,
  },
  btn: {
    backgroundColor: theme.colors.primary, 
    borderRadius: theme.radii.md, 
    paddingVertical: 14,
    alignItems: 'center', marginTop: theme.spacing.sm,
    ...theme.shadows.glow,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { 
    color: '#fff', 
    fontSize: theme.typography.sizes.md, 
    fontWeight: theme.typography.weights.semibold as any 
  },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted },
  switchLink: { 
    fontSize: theme.typography.sizes.sm, 
    color: theme.colors.primary, 
    fontWeight: theme.typography.weights.semibold as any 
  },
});
