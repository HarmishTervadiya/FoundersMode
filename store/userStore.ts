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
  fetchProfile: (userId: string) => Promise<Profile | null>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  upsertProfile: (userId: string, updates: Partial<Profile>) => Promise<void>;
  checkUsernameUnique: (username: string) => Promise<boolean>;
  createOrFetchProfile: (
    userId: string,
    email?: string
  ) => Promise<{ profile: Profile | null; isNew: boolean }>;
  updateLastLogDate: () => Promise<void>;
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
      return data;
    }
    return null;
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

  upsertProfile: async (userId, updates) => {
    // 1. Optimistic Update (Immediate UI feedback)
    const { profile } = get();
    // Use existing profile or create scaffold
    const optimisticProfile = {
      ...(profile || {}),
      id: userId,
      ...updates,
    } as Profile;

    set({ profile: optimisticProfile });

    // 2. Perform DB Sync
    const { data, error } = await runAsync<Profile>(set, async () => {
      return await supabase
        .from("profiles")
        .upsert({ id: userId, ...updates })
        .select()
        .single();
    });

    // 3. Rollback/Confirm
    if (error) {
      console.log("Upsert failed, rolling back");
      set({ profile }); // Reset to previous
    } else if (data) {
      set({ profile: data }); // Ensure we have the server-side version (e.g. timestamps)
    }
  },

  checkUsernameUnique: async (username: string) => {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", trimmed)
      .limit(1);

    if (error) {
      console.error("Username check failed:", error);
      return false;
    }

    // If no results, username is unique
    return !data || data.length === 0;
  },

  createOrFetchProfile: async (userId: string, email?: string) => {
    set({ isLoading: true, error: null });

    try {
      // First, try to fetch existing profile (use maybeSingle to avoid error when not found)
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (existingProfile) {
        // Profile exists - return it
        console.log("[UserStore] Existing profile found:", existingProfile.id);
        set({ profile: existingProfile, isLoading: false });
        return { profile: existingProfile, isNew: false };
      }

      // Profile doesn't exist - create new one
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const newProfileData = {
        id: userId,
        username: null,
        level: 1,
        lifetime_xp: 0,
        energy: 100,
        current_streak: 0,
        last_log_date: today,
        str_builder: 0,
        int_architect: 0,
        wis_zen: 0,
        cha_hustler: 0,
        con_grit: 0,
      };

      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert(newProfileData)
        .select()
        .single();

      if (createError) {
        console.error("Profile creation failed:", createError);
        set({ isLoading: false, error: createError.message });
        return { profile: null, isNew: false };
      }

      set({ profile: newProfile, isLoading: false });
      return { profile: newProfile, isNew: true };
    } catch (err: any) {
      console.error("createOrFetchProfile error:", err);
      set({ isLoading: false, error: err.message });
      return { profile: null, isNew: false };
    }
  },

  updateLastLogDate: async () => {
    const profile = get().profile;
    if (!profile) return;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    // Skip if already logged today
    if (profile.last_log_date === today) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ last_log_date: today })
        .eq("id", profile.id);

      if (!error) {
        set({ profile: { ...profile, last_log_date: today } });
        console.log("[UserStore] Updated last_log_date to:", today);
      }
    } catch (err) {
      console.error("Failed to update last_log_date:", err);
    }
  },
}));
