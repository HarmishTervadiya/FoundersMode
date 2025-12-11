import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase.types";
import { runAsync } from "../utils/storeHelpers";

// Exact type derived from your Database schema
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async (userId: string) => {
    const { data, error } = await runAsync<Profile>(set, async () => {
      return await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
    });

    if (!error && data) {
      set({ profile: data });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;

    // 1. Optimistic Update (Immediate UI feedback)
    set({ profile: { ...profile, ...updates } });

    // 2. Perform DB Sync with Error Handling
    const { error } = await runAsync(set, async () => {
      return await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);
    });

    // 3. Rollback if failed
    if (error) {
      console.log("Update failed, rolling back optimistic update");
      set({ profile }); // Reverts to the state before the optimistic update
    }
  },
}));
