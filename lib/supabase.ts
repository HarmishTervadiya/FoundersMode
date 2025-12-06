import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 1. Custom Storage Adapter for Web vs Mobile
const ExpoSecureAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing Supabase URL or Anon Key');
}

// 2. Initialize Client with Auth Persistence
export const supabase = createClient(url, key, {
  auth: {
    // Use SecureStore on mobile, localStorage on web (auto-handled)
    storage: Platform.OS === 'web' ? AsyncStorage : ExpoSecureAdapter, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});