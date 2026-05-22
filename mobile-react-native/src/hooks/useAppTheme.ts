import { useThemeStore } from '../store/useThemeStore';
import { theme as baseTheme, themesList, ThemeName } from '@chatty/shared-core';

export const useAppTheme = () => {
  const activeTheme = useThemeStore((state) => state.activeTheme);
  const chatPattern = useThemeStore((state) => state.chatPattern);
  
  // Fallback to whatsapp if theme not found
  const colors = themesList[activeTheme] || themesList['whatsapp'] || baseTheme.colors;

  const dynamicTheme = {
    ...baseTheme,
    colors
  };

  return {
    theme: dynamicTheme,
    colors,
    activeTheme,
    chatPattern
  };
};
