/**
 * useTheme Hook
 *
 * Provides access to the current theme configuration.
 * Currently uses hardcoded theme from theme.config.ts
 */

import {
  CURRENT_THEME,
  THEME_CLASSES,
  THEME_NAMES,
  type ThemeKey,
} from "@/constants/theme.config";
import { useMemo } from "react";

export interface ThemeConfig {
  key: ThemeKey;
  name: string;
  themeClass: string;
}

export function useTheme(): ThemeConfig {
  return useMemo(
    () => ({
      key: CURRENT_THEME,
      name: THEME_NAMES[CURRENT_THEME],
      themeClass: THEME_CLASSES[CURRENT_THEME],
    }),
    []
  );
}
