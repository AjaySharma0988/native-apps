/**
 * React Native Root Navigator
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/useAuthStore';
import { useCallStore } from '../store/useCallStore';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import CallScreen from '../screens/CallScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Components
import IncomingCallOverlay from '../components/IncomingCallOverlay';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Call" component={CallScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
  const { incomingCall } = useCallStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isCheckingAuth) {
    // Show splash while checking auth
    return null;
  }

  return (
    <NavigationContainer>
      {authUser ? <AppStack /> : <AuthStack />}
      {/* Floating incoming call overlay (shown on any screen when call arrives) */}
      {incomingCall && <IncomingCallOverlay />}
    </NavigationContainer>
  );
}
