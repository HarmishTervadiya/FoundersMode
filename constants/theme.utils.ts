/**
 * Theme Utilities for FoundersMode
 *
 * The primary theming system uses:
 * 1. CSS variables in global.css (--color-accent, --color-text-primary, etc.)
 * 2. Theme class on root layout (theme-emerald, theme-cyan, theme-violet)
 * 3. Semantic NativeWind classes (bg-accent, text-text-primary, etc.)
 *
 * For inline styles (icon colors, etc.), use the Colors constant from theme.ts
 * with useTheme() hook to get the current theme key.
 *
 * Example:
 * const { key: themeKey } = useTheme();
 * const iconColor = Colors[themeKey]?.text || Colors.emerald.text;
 */

import { Colors } from "./theme";
import { CURRENT_THEME, type ThemeKey } from "./theme.config";

// Helper function for joining classnames
export function cx(...parts: (string | boolean | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

// Get colors for the current theme (for StyleSheet usage)
export const colors = {
  get primary() {
    return (Colors as any)[CURRENT_THEME]?.text || Colors.emerald.text;
  },
  get bg() {
    return "#020617";
  }, // slate-950
};

// Export theme key for convenience
export { CURRENT_THEME };
export type { ThemeKey };
