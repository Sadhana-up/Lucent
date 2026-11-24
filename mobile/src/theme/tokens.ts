// Subpath imports ship only the five weights we use (the package roots ship every variant).
import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond/300Light';
import { CormorantGaramond_300Light_Italic } from '@expo-google-fonts/cormorant-garamond/300Light_Italic';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono/400Regular';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';

/** Lucent design tokens — mirrored from lucent-splash.css. */
export const colors = {
  sage: '#2D5A3D',
  sageLight: '#3D7A52',
  sageDark: '#1E3D2A',
  violet: '#7C6BEA',
  violetLight: '#9B8DF0',
  rose: '#E8B4B8',
  cream: '#FAF6F0',
  night: '#0B1912',
  ink: '#1A1D21',
  ink2: '#5A5F6B',
} as const;

/** The two CSS timing functions, as [x1, y1, x2, y2]. */
export const easings = {
  smooth: [0.16, 1, 0.3, 1],
  springy: [0.34, 1.56, 0.64, 1],
} as const;

/** Font family names registered by expo-font (keys of the map below). */
export const fonts = {
  serif: 'CormorantGaramond_300Light',
  serifItalic: 'CormorantGaramond_300Light_Italic',
  sans: 'PlusJakartaSans_600SemiBold',
  sansRegular: 'PlusJakartaSans_400Regular',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
} as const;

export const FONT_MAP = {
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_500Medium_Italic,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  GeistMono_400Regular,
  GeistMono_500Medium,
};
