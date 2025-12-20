import {
  CURRENT_THEME,
  THEME_CLASSES,
  THEME_NAMES,
  type ThemeKey,
} from "@/constants/theme.config";
import { usePreferenceStore } from "@/store/preferenceStore";
import { useMemo } from "react";

export interface ThemeConfig {
  key: ThemeKey;
  name: string;
  themeClass: string;
}

export function useTheme(): ThemeConfig {
  const { devTheme } = usePreferenceStore();

  // Use devTheme if set (and we are in dev mode potentially, though store handles logic), otherwise default
  // Note: __DEV__ check is already implicitly handled by UI only showing toggle in dev,
  // but we can enforce it here if we want strictly no override in prod.
  const activeKey = __DEV__ && devTheme ? devTheme : CURRENT_THEME;

  return useMemo(
    () => ({
      key: activeKey,
      name: THEME_NAMES[activeKey],
      themeClass: THEME_CLASSES[activeKey],
    }),
    [activeKey]
  );
}
