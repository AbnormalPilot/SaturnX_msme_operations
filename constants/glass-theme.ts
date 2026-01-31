/**
 * Liquid Glass Theme - Premium Design System
 */

export const GlassColors = {
  // Glass backgrounds with blur
  glass: {
    light: 'rgba(255, 255, 255, 0.4)',   // More transparent
    medium: 'rgba(255, 255, 255, 0.6)',  // Medium glass
    strong: 'rgba(255, 255, 255, 0.85)', // Strong but still see-through
    dark: 'rgba(0, 0, 0, 0.3)',
  },

  // Accent gradients
  gradient: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#f093fb', '#f5576c'],
    success: ['#4facfe', '#00f2fe'],
    accent: ['#fa709a', '#fee140'],
    neural: ['#a8edea', '#fed6e3'],
  },

  // UI colors
  text: {
    primary: 'rgba(0, 0, 0, 0.9)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    tertiary: 'rgba(0, 0, 0, 0.4)',
    inverse: 'rgba(255, 255, 255, 0.95)',
  },

  // Surfaces
  surface: {
    elevated: 'rgba(255, 255, 255, 0.8)',
    card: 'rgba(255, 255, 255, 0.6)',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },

  // Border
  border: {
    light: 'rgba(255, 255, 255, 0.3)',
    strong: 'rgba(255, 255, 255, 0.6)',
  },
};

export const GlassSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const GlassRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 9999,
};

export const GlassShadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const GlassAnimation = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    spring: { damping: 20, stiffness: 90 },
    smooth: { damping: 15, stiffness: 100 },
  },
};
