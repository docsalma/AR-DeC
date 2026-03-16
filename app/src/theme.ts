/**
 * AR-DeC Design System — Student-Friendly Material Design 3
 * Warm, inviting, Duolingo-inspired with React Native Paper
 */
import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Student-friendly color palette
export const colors = {
  // Primary — friendly blue
  primary: '#4A90D9',
  primaryLight: '#D6E8FA',
  primaryDark: '#2B5F9E',
  onPrimary: '#FFFFFF',

  // Secondary — warm orange for gamification
  secondary: '#FF9F43',
  secondaryLight: '#FFF0DB',
  secondaryDark: '#E67E22',
  onSecondary: '#FFFFFF',

  // Tertiary — green for success/mastery
  tertiary: '#26DE81',
  tertiaryLight: '#D5F5E3',
  tertiaryDark: '#1B9E5A',

  // Error / wrong answers
  error: '#EE5A52',
  errorLight: '#FDEDED',

  // Surfaces
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2F7',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#2D3436',
  textSecondary: '#7F8C8D',
  textMuted: '#B2BEC3',

  // Borders & dividers
  outline: '#DFE6E9',
  outlineVariant: '#EEF2F7',

  // Gamification accents
  gold: '#FFD32A',
  goldLight: '#FFF8DC',
  purple: '#A55EEA',
  purpleLight: '#F0E6FF',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  scrim: 'rgba(45,52,54,0.6)',

  // Dark surfaces
  surfaceDark: '#0F1923',
  cameraBackground: '#000',
};

// Paper MD3 theme
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    primaryContainer: colors.primaryLight,
    onPrimaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    onSecondary: colors.onSecondary,
    secondaryContainer: colors.secondaryLight,
    onSecondaryContainer: colors.secondaryDark,
    tertiary: colors.tertiary,
    tertiaryContainer: colors.tertiaryLight,
    error: colors.error,
    errorContainer: colors.errorLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    outline: colors.outline,
    outlineVariant: colors.outlineVariant,
  },
  roundness: 16,
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
