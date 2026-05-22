/**
 * Shared Core Design Tokens
 * Replicates the WhatsApp Dark Theme used on the Web/Electron client.
 */
export const theme = {
  colors: {
    primary: '#00A884',        // WhatsApp Teal / Green
    primaryDark: '#005C4B',    // Sent bubble green
    background: '#111B21',     // Main chat dark background
    sidebar: '#0B141A',        // Sidebar lists background
    header: '#202D35',         // Nav and Chat header background
    input: '#2A3942',          // Search / message input background
    border: '#222E35',         // Borders and divider lines
    sentBubble: '#005C4B',     // Sent bubble background
    receivedBubble: '#1F2C34', // Received bubble background
    textMain: '#E9EDEF',       // High-contrast text
    textMuted: '#8696A0',      // Metadata / description text
    textLight: '#E9EDEF',      // Light bubble text
    activeBadge: '#00A884',    // Unread count and active status green
    error: '#F87171',          // Rejected call red accent
    success: '#4ADE80',        // Call incoming green accent
    online: '#00A884',         // Online status dot
    white: '#FFFFFF',
    transparent: 'transparent',
    overlay: 'rgba(11, 20, 26, 0.85)', // High contrast screen overlays
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radii: {
    xs: 4,
    sm: 8,
    md: 10,
    lg: 14,
    xl: 20,
    bubble: 16,
    avatar: 9999,
  },
  typography: {
    families: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      mono: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
    },
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 18,
      xl: 22,
      xxl: 28,
    },
    weights: {
      light: '300',
      regular: '400',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
    }
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 10,
    },
    glow: {
      shadowColor: '#00A884',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    }
  },
  glassmorphism: {
    backdropBlur: 10,
    bgOpacity: 0.12,
    borderOpacity: 0.17,
  },
  animations: {
    durations: {
      waPopIn: 250,
      slideIn: 300,
      fade: 200,
    },
    easings: {
      easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }
  }
};

export type ThemeType = typeof theme;
