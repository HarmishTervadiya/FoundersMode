import { create } from 'zustand';
import { ThemeKey } from '../constants/theme.config';
import { storage, STORAGE_KEYS } from '../lib/storage';

interface PreferenceState {
  devTheme: ThemeKey | null; // null means utilize default config
  setDevTheme: (theme: ThemeKey | null) => void;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  devTheme: (storage.getString(STORAGE_KEYS.DEV_THEME) as ThemeKey) || null,

  setDevTheme: (theme) => {
    if (theme) {
      storage.set(STORAGE_KEYS.DEV_THEME, theme);
    } else {
      storage.remove(STORAGE_KEYS.DEV_THEME);
    }
    set({ devTheme: theme });
  },
}));
