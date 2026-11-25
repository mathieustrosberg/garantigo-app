import { useColorScheme } from 'react-native';

/*
 * Brand colours, for what cannot be styled with a class name: navigation, native tabs,
 * icons and the calendar.
 * The same values are in `global.css`: keep both in sync.
 */

/** Periwinkle blue, the `--accent` colour in light mode. */
export const BRAND_COLOR = '#4A63E7';

/** Lighter periwinkle blue, the `--accent` colour in dark mode. */
export const BRAND_COLOR_ON_DARK = '#ADBCFF';

/** The `--background` colour in light mode. */
export const LIGHT_BACKGROUND = '#F4F5FA';

/** The `--background` colour in dark mode. */
export const DARK_BACKGROUND = '#0F1115';

/** Brand colour that follows the theme of the phone. */
export function useBrandTint(): string {
  return useColorScheme() === 'dark' ? BRAND_COLOR_ON_DARK : BRAND_COLOR;
}

/** Colour of what is drawn on top of the brand colour: white in light mode, dark in dark mode. */
export function useOnBrandColor(): string {
  return useColorScheme() === 'dark' ? '#10131A' : '#FFFFFF';
}

/** Colour of what is not selected, the `--muted` colour: for the icons of the tab bar. */
export function useMutedColor(): string {
  return useColorScheme() === 'dark' ? '#9BA2B3' : '#71717B';
}
