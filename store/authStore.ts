import { Session, User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { runAsync } from "../utils/storeHelpers";

// Ensure WebBrowser can complete the auth session on return
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  // UPDATED: Now returns a Promise with data/error so UI can handle it
  signInWithKey: (
    secretKey: string
  ) => Promise<{ data: any; error: string | null }>;
  signUpWithKey: () => Promise<{ success: boolean; key?: string }>;
  signInWithGoogle: () => Promise<{ data: any; error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    console.log("[AuthStore] initialize called");
    set({ isLoading: true, error: null });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log(
        "[AuthStore] getSession result:",
        session ? "Session found" : "No session"
      );

      if (session?.user) {
        // Wait for profile data to load before clearing loading state
        const { useUserStore } = await import("./userStore");
        await useUserStore.getState().fetchProfile(session.user.id);
      }

      console.log("[AuthStore] Session user:", session?.user?.id);
      set({ session, user: session?.user ?? null, isLoading: false });

      supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log("[AuthStore] onAuthStateChange event:", _event);
        if (_event === "SIGNED_IN" && session?.user) {
          const { useUserStore } = await import("./userStore");
          await useUserStore.getState().fetchProfile(session.user.id);
        }
        set({ session, user: session?.user ?? null, isLoading: false });
      });
    } catch (e) {
      console.log("Auth check failed (expected if first launch)", e);
      set({ isLoading: false });
    }
  },

  signInWithKey: async (secretKey: string) => {
    const formattedKey = secretKey.trim().toUpperCase();
    const dummyEmail = `${formattedKey}@foundersrpg.com`;

    // FIX: Added 'return' so the UI receives the result { data, error }
    return await runAsync(set, async () => {
      return await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: formattedKey,
      });
    });
  },

  signUpWithKey: async () => {
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    const newKey = `RPG-${randomSuffix}`;
    const dummyEmail = `${newKey}@foundersrpg.com`;

    const { error } = await runAsync(set, async () => {
      return await supabase.auth.signUp({
        email: dummyEmail,
        password: newKey,
        options: {
          data: {
            username: newKey,
            secret_key: newKey,
          },
        },
      });
    });

    if (error) return { success: false };
    return { success: true, key: newKey };
  },

  signInWithGoogle: async () => {
    return await runAsync(set, async () => {
      const redirectUrl = makeRedirectUri({
        scheme: "foundersmode",
        path: "auth/callback",
      });
      console.log("[AuthStore] Redirecting to:", redirectUrl);

      // Warm up for better stability on Android
      try {
        await WebBrowser.warmUpAsync();
      } catch (e) {
        console.error("[AuthStore] Warmup failed", e);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Small delay on Android to ensure Activity is ready/focused
        if (Platform.OS === "android") {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        console.log("[AuthStore] Opening browser for OAuth...");
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log("[AuthStore] Browser result type:", result.type);

        if (result.type === "success" && result.url) {
          console.log("[AuthStore] Success! Parsing URL:", result.url);

          // Extract tokens from URL hash (format: #access_token=...&refresh_token=...)
          const url = result.url;
          const hashParams = new URLSearchParams(
            url.includes("#") ? url.split("#")[1] : url.split("?")[1] || ""
          );

          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");

          console.log("[AuthStore] access_token exists:", !!access_token);
          console.log("[AuthStore] refresh_token exists:", !!refresh_token);

          if (access_token && refresh_token) {
            // Manually set the session with extracted tokens
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });

            console.log(
              "[AuthStore] setSession result:",
              sessionData?.session ? "Session set!" : "No session"
            );
            if (sessionError) {
              console.error("[AuthStore] setSession error:", sessionError);
            }

            if (sessionData?.session) {
              set({
                session: sessionData.session,
                user: sessionData.session.user,
              });
              console.log(
                "[AuthStore] Session stored! User ID:",
                sessionData.session.user?.id
              );
            }
          } else {
            console.log(
              "[AuthStore] No tokens found in URL, trying getSession..."
            );
            // Fallback: try getSession in case tokens were stored differently
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              set({ session, user: session.user });
              console.log(
                "[AuthStore] Fallback session found:",
                session.user?.id
              );
            }
          }
        } else if (result.type === "cancel") {
          console.log("[AuthStore] User cancelled OAuth");
        }
      }

      try {
        await WebBrowser.coolDownAsync();
      } catch (e) {
        console.error("[AuthStore] Cooldown failed", e);
      }

      return { data, error };
    });
  },

  signOut: async () => {
    await runAsync(set, () => supabase.auth.signOut());
    set({ session: null, user: null });
  },
}));
