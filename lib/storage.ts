import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const STORAGE_KEYS = {
  HAS_SEEN_ONBOARDING: 'fndr_has_seen_onboarding',
  DEV_THEME: 'dev.theme',
};
