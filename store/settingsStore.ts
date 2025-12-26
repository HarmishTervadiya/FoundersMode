import { soundService } from "@/utils/soundService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const SOUND_ENABLED_KEY = "founders_sound_enabled";

interface SettingsState {
  soundEnabled: boolean;
  initialize: () => Promise<void>;
  toggleSound: (value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
      // Default to true if null (not set yet)
      const isEnabled = stored !== null ? stored === "true" : true;

      set({ soundEnabled: isEnabled });
      soundService.setEnabled(isEnabled);
    } catch (e) {
      console.warn("Failed to load settings", e);
      // Fallback to default
      set({ soundEnabled: true });
      soundService.setEnabled(true);
    }
  },

  toggleSound: async (value: boolean) => {
    set({ soundEnabled: value });
    soundService.setEnabled(value);
    try {
      await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(value));
    } catch (e) {
      console.warn("Failed to save sound setting", e);
    }
  },
}));
