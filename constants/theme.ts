import { MD3LightTheme } from "react-native-paper";

// Soft pastel colors for MSME-friendly design
export const Colors = {
  // Action Card Colors (soft pastels)
  scanBlue: "#E3F2FD", // Light blue for Scan
  scanBlueDark: "#1976D2", // Darker blue for icon
  createGray: "#F5F5F5", // Light gray for Create
  createGrayDark: "#616161", // Darker gray for icon
  trackGreen: "#E8F5E9", // Light green for Track
  trackGreenDark: "#388E3C", // Darker green for icon
  askYellow: "#F3E5F5", // Light Purple for Ask AI (was yellow)
  askYellowDark: "#7C4DFF", // Vibrant Purple for icon

  // Primary colors
  primary: "#4285F4", // Google Blue
  secondary: "#34A853", // Google Green
  accent: "#FBBC04", // Google Yellow
  error: "#EA4335", // Google Red

  // Neutral colors
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceVariant: "#F8F9FA",
  text: "#202124",
  textSecondary: "#5F6368",
  textTertiary: "#9AA0A6",
  border: "#E8EAED",

  // Bottom nav colors
  navBackground: "#1A1A1A",
  navActive: "#FFFFFF",
  navInactive: "#9E9E9E",
  fabGradientStart: "#4285F4",
  fabGradientEnd: "#34A853",

  // AI Sheet Colors (glassmorphic design)
  sheetGlass: "rgba(255, 255, 255, 0.95)",
  sheetGlassDark: "rgba(26, 26, 26, 0.95)",
  cardGlass: "rgba(248, 249, 250, 0.6)",

  // AI Message bubbles
  userBubbleGradient1: "#4285F4",
  userBubbleGradient2: "#5E97F6",
  aiBubble: "#F8F9FA",

  // AI accent
  aiAccent: "#7C4DFF",
  aiAccentLight: "#F3E5F5",
  aiGlow: "rgba(124, 77, 255, 0.15)",

  // Action icons
  actionIconNeutral: "#5F6368",
  actionIconActive: "#4285F4",
  actionIconDanger: "#EA4335",
};

export const businessAITheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    onPrimary: "#FFFFFF",
    secondary: Colors.secondary,
    onSecondary: "#FFFFFF",
    tertiary: Colors.accent,
    error: Colors.error,
    background: Colors.background,
    surface: Colors.surface,
    onSurface: Colors.text,
    surfaceVariant: Colors.surfaceVariant,
  },
  fonts: {
    ...MD3LightTheme.fonts,
  },
};

// Spacing system
export const Spacing = {
  xs: 6, // Increased from 4
  sm: 10, // Increased from 8
  md: 18, // Increased from 16
  lg: 26, // Increased from 24
  xl: 36, // Increased from 32
  xxl: 54, // Increased from 48
};

// Typography scale (comfortable for 30-40 yr group)
export const Typography = {
  h1: {
    fontSize: 26,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: "500" as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// AI Sheet Typography
export const AITypography = {
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  messageUser: {
    fontSize: 16,
    fontWeight: "500" as const,
    lineHeight: 24,
  },
  messageAI: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 26,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 22,
    color: "#5F6368",
  },
};
