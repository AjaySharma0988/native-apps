/**
 * React Native Signup Screen
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

export default function SignupScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = getStyles(theme);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, isSigningUp } = useAuthStore();

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) return;
    await signup({ fullName: fullName.trim(), email: email.trim(), password });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}><Text style={styles.logoEmoji}>💬</Text></View>
            <Text style={styles.logoTitle}>Chatty</Text>
            <Text style={styles.logoSub}>Create your account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Get Started</Text>
            <Text style={styles.cardSub}>Sign up to start chatting</Text>

            {[
              { label: 'Full Name', value: fullName, setter: setFullName, placeholder: 'Your full name', type: 'default' as const },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'your@email.com', type: 'email-address' as const },
              { label: 'Password', value: password, setter: setPassword, placeholder: '••••••••', type: 'default' as const, secure: true },
            ].map(({ label, value, setter, placeholder, type, secure }) => (
              <View key={label} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={theme.colors.textMuted}
                  value={value}
                  onChangeText={setter}
                  keyboardType={type}
                  autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                  autoCorrect={false}
                  secureTextEntry={secure}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.btn, isSigningUp && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={isSigningUp}
              activeOpacity={0.8}
            >
              {isSigningUp
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Create Account</Text>
              }
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.switchLink}>Sign In</Text>
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
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logoBox: { 
    width: 60, height: 60, borderRadius: theme.radii.bubble, 
    backgroundColor: theme.colors.primary, 
    alignItems: 'center', justifyContent: 'center', 
    marginBottom: theme.spacing.sm, 
    ...theme.shadows.glow,
  },
  logoEmoji: { fontSize: 28 },
  logoTitle: { 
    fontSize: theme.typography.sizes.xl + 4, 
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
    marginBottom: theme.spacing.xl 
  },
  inputGroup: { marginBottom: 14 },
  label: { 
    fontSize: theme.typography.sizes.sm, 
    color: theme.colors.textMuted, 
    fontWeight: theme.typography.weights.semibold as any, 
    marginBottom: 6 
  },
  input: { 
    backgroundColor: theme.colors.input, borderWidth: 1, borderColor: theme.colors.border, 
    borderRadius: theme.radii.md, paddingHorizontal: 14, paddingVertical: 12, 
    color: theme.colors.textMain, fontSize: theme.typography.sizes.md 
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
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  switchText: { fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted },
  switchLink: { 
    fontSize: theme.typography.sizes.sm, 
    color: theme.colors.primary, 
    fontWeight: theme.typography.weights.semibold as any 
  },
});
