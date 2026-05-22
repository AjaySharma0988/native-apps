import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeName } from '@chatty/shared-core';

interface ThemeState {
  activeTheme: ThemeName;
  chatPattern: string;
  isThemeLoaded: boolean;

  setTheme: (theme: ThemeName) => Promise<void>;
  setChatPattern: (pattern: string) => Promise<void>;
  loadThemeSettings: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  activeTheme: 'whatsapp',
  chatPattern: 'whatsapp',
  isThemeLoaded: false,

  setTheme: async (theme) => {
    set({ activeTheme: theme });
    try {
      await AsyncStorage.setItem('chat-theme', theme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  },

  setChatPattern: async (pattern) => {
    set({ chatPattern: pattern });
    try {
      await AsyncStorage.setItem('chat-pattern', pattern);
    } catch (e) {
      console.error('Failed to save chat pattern', e);
    }
  },

  loadThemeSettings: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('chat-theme');
      const savedPattern = await AsyncStorage.getItem('chat-pattern');
      
      set({
        activeTheme: (savedTheme as ThemeName) || 'whatsapp',
        chatPattern: savedPattern || 'whatsapp',
        isThemeLoaded: true,
      });
    } catch (e) {
      set({ isThemeLoaded: true });
    }
  },
}));
