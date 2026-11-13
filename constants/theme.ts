/**
 * Vámonos Design System
 * "Golden-hour flyer" - warm cream paper, ink borders, hard sticker shadows,
 * hot coral + butter accents, poster-weight type.
 */

export const Colors = {
  ink: '#1C1410',
  inkSoft: '#6E5F52',

  // Surfaces
  paper: '#F4EBDC',
  card: '#FFFBF2',
  background: '#F4EBDC',
  backgroundElevated: '#FFFBF2',
  backgroundTertiary: '#E9DEC8',

  // Brand
  primary: '#FF4A2D',
  accent: '#FF4A2D',
  accentSoft: 'rgba(255, 74, 45, 0.12)',
  butter: '#FFC53D',

  // Semantic
  success: '#1F9D55',
  warning: '#FF9500',
  danger: '#E63B25',
  info: '#4A90D9',

  // Text
  text: '#1C1410',
  textSecondary: '#6E5F52',
  textTertiary: '#A89885',

  // Lines
  separator: 'rgba(28, 20, 16, 0.18)',
  separatorLight: 'rgba(28, 20, 16, 0.08)',
  border: '#1C1410',

  // Overlays
  overlay: 'rgba(28, 20, 16, 0.5)',
  sheetBackground: 'rgba(255, 251, 242, 0.98)',

  // Tab bar (dark ink bar)
  tabBar: '#1C1410',
  tabActive: '#FFC53D',
  tabInactive: 'rgba(255, 251, 242, 0.5)',

  white: '#FFFFFF',
} as const;

// Warm, sticker-like palette for avatars and friend pins
export const FriendColors = ['#FF4A2D', '#FF9F1C', '#2EC4A6', '#5E60CE', '#F72585', '#4A90D9'] as const;

export const EMOJI_FONT = 'NotoColorEmoji_400Regular';
export const withEmoji = (fam: string) => fam + ', NotoColorEmoji_400Regular';

const DISPLAY = 'Archivo_900Black';
const HEAVY = 'Archivo_800ExtraBold';
const BOLD = 'Archivo_700Bold';
const SEMI = 'Archivo_600SemiBold';
const MED = 'Archivo_500Medium';
const REG = 'Archivo_400Regular';

export const Typography = {
  display: {
    fontFamily: DISPLAY,
    fontSize: 40,
    letterSpacing: -1,
  },
  largeTitle: {
    fontFamily: DISPLAY,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  title1: {
    fontFamily: HEAVY,
    fontSize: 27,
    letterSpacing: -0.4,
  },
  title2: {
    fontFamily: HEAVY,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  title3: {
    fontFamily: BOLD,
    fontSize: 19,
    letterSpacing: -0.2,
  },
  headline: {
    fontFamily: BOLD,
    fontSize: 17,
  },
  body: {
    fontFamily: REG,
    fontSize: 16,
  },
  callout: {
    fontFamily: MED,
    fontSize: 15,
  },
  subhead: {
    fontFamily: MED,
    fontSize: 14,
  },
  footnote: {
    fontFamily: SEMI,
    fontSize: 13,
  },
  caption1: {
    fontFamily: SEMI,
    fontSize: 12,
  },
  caption2: {
    fontFamily: BOLD,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  eyebrow: {
    fontFamily: BOLD,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 100,
  full: 9999,
} as const;

// Hard "sticker" shadows - offset ink, no blur
const hard = (x: number, y: number) => ({
  shadowColor: Colors.ink,
  shadowOffset: { width: x, height: y },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: Math.max(x, y),
});

export const Shadows = {
  small: hard(2, 2),
  medium: hard(3, 3),
  large: hard(5, 5),
  sheet: {
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
} as const;

// Quick-action category chips for the home screen
export const ActivityCategories = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'sports', label: 'Hoops', emoji: '🏀' },
  { id: 'food', label: 'Food Run', emoji: '🍕' },
  { id: 'movies', label: 'Movie', emoji: '🎬' },
  { id: 'beach', label: 'Beach', emoji: '🏖️' },
  { id: 'gaming', label: 'Game Night', emoji: '🎮' },
  { id: 'music', label: 'Concert', emoji: '🎵' },
  { id: 'fitness', label: 'Gym', emoji: '💪' },
  { id: 'hangout', label: 'Hang', emoji: '🛋️' },
] as const;
