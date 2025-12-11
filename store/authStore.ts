import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { runAsync } from '@/utils/storeHelpers';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithKey: (secretKey: string) => Promise<void>;
  signUpWithKey: () => Promise<{ success: boolean; key?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    // We don't use runAsync here because we don't want to flash error states 
    // just for checking a session on mount.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, isLoading: false });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false });
      });
    } catch (e) {
      console.log('Auth check failed (expected if first launch)');
      set({ isLoading: false });
    }
  },

  signInWithKey: async (secretKey: string) => {
    const formattedKey = secretKey.trim().toUpperCase();
    const dummyEmail = `${formattedKey}@foundersrpg.com`;

    // Wrap the Supabase call with our centralized handler
    await runAsync(set, async () => {
      // Return the Supabase promise directly
      return await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: formattedKey,
      });
    });
  },

  signUpWithKey: async () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `RPG-${randomSuffix}`;
    const dummyEmail = `${newKey}@foundersrpg.com`;

    // Using runAsync to handle the loading/error bits
    const { error } = await runAsync(set, async () => {
      return await supabase.auth.signUp({
        email: dummyEmail,
        password: newKey,
        options: {
          data: {
            username: newKey, // Important: Matches the Trigger logic
            secret_key: newKey,
          },
        },
      });
    });

    if (error) return { success: false };
    return { success: true, key: newKey };
  },

  signOut: async () => {
    await runAsync(set, () => supabase.auth.signOut());
    set({ session: null, user: null });
  },
}));