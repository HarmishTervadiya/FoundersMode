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
  updateLastLogin: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  toggleDailyReminder: (isEnabled: boolean) => Promise<void>;
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
      const newProfileData = {
        id: userId,
        username: null,
        level: 1,
        lifetime_xp: 0,
        energy: 100,
        current_streak: 0,
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

  updateLastLogin: async () => {
    const { profile, updateProfile } = get();
    if (!profile) return;

    await updateProfile({ last_log_date: new Date().toISOString() });
  },
  updateUsername: async (newUsername: string) => {
    const { profile } = get();
    if (!profile) return;

    // Server-side constraint should handle this, but client-side check is good too
    if (profile.last_username_change) {
      const lastChange = new Date(profile.last_username_change);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastChange.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        throw new Error(
          `Username can only be changed once every 30 days. Try again in ${30 - diffDays} days.`
        );
      }
    }

    // 1. Optimistic Update (Immediate UI feedback)
    set({ profile: { ...profile, username: newUsername } });

    // 2. Perform DB Sync
    const { data, error } = await runAsync<Profile>(set, async () => {
      return await supabase
        .from("profiles")
        .update({
          username: newUsername,
          last_username_change: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select()
        .single();
    });

    if (error) {
      set({ profile }); // Rollback to old profile object (captured in closure scope? No, need to be careful)
      // Actually 'profile' var is stale closure if we used 'const {profile} = get()'.
      // But we can fetch it again or just undo the specific field change?
      // Simplest rollback is usually fetching fresh, but here we can just set old 'profile' since it was const.
      // Wait, 'profile' is a reference object. If I did shallow copy in optimistic update, 'profile' var still holds old reference?
      // "set({ profile: { ...profile, ... } })" creates new object. 'const profile' is the old one. Correct.
      set({ profile });
      throw new Error(error);
    } else if (data) {
      // 3. Confirm with server data
      set({ profile: data });
    }
  },

  toggleDailyReminder: async (isEnabled: boolean) => {
    const { profile } = get();
    if (!profile) return;

    // Optimistic
    set({ profile: { ...profile, daily_reminder: isEnabled } });

    const { data, error } = await runAsync<Profile>(set, async () => {
      return await supabase
        .from("profiles")
        .update({ daily_reminder: isEnabled })
        .eq("id", profile.id)
        .select()
        .single();
    });

    if (error) {
      set({ profile }); // Rollback
    } else if (data) {
      set({ profile: data });
    }
  },
}));
