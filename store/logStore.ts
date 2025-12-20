import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { ai, LogAnalysisResult } from "../services/ai";
import { runAsync } from "../utils/storeHelpers";
import { useLevelStore } from "./levelStore";
import { useUserStore } from "./userStore";

export interface Log {
  id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  difficulty_tier: number | null;
  total_fp_awarded: number | null;
  total_xp_awarded: number | null;
  analysis_report: string | null;
  strategic_insight: string | null;
  xp_breakdown: Record<string, number> | null;
}

interface LogState {
  logs: Log[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLogs: (userId: string) => Promise<void>;
  addLog: (
    userId: string,
    content: string
  ) => Promise<LogAnalysisResult | null>;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,

  fetchLogs: async (userId: string) => {
    const { data } = await runAsync<Log[]>(set, async () => {
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    });

    if (data) {
      set({ logs: data });
    }
  },

  addLog: async (userId: string, content: string) => {
    set({ isLoading: true, error: null });
    try {
      const { logs } = get();

      // 1. Check Daily FP Limit
      const today = new Date().toISOString().split("T")[0];
      const todayLogs = logs.filter((log) => log.created_at.startsWith(today));
      const todayTotalFP = todayLogs.reduce(
        (sum, log) => sum + (log.total_fp_awarded || 0),
        0
      );

      if (todayTotalFP >= 100) {
        throw new Error(
          "Daily Focus Limit Reached (100/100). Rest now, founder."
        );
      }

      // 2. AI Analysis
      const analysis = await ai.analyzeLog(content);

      // 3. Apply Logic caps and costs
      let finalFP = analysis.total_fp;
      // Clamp to remaining daily limit
      const remainingFP = 100 - todayTotalFP;
      if (finalFP > remainingFP) {
        finalFP = remainingFP;
      }

      // MP Cost Logic
      // Rule: >65 reduce MP. >79 "additionally" reduce MP.
      let mpCost = 0;
      if (analysis.total_fp > 79) {
        mpCost = 15;
      } else if (analysis.total_fp > 65) {
        mpCost = 5;
      }

      // 4. Atomic-ish DB Updates
      // Step A: Insert Log
      const newLogData = {
        user_id: userId,
        content: content,
        difficulty_tier: analysis.difficulty_tier,
        total_fp_awarded: finalFP,
        total_xp_awarded: analysis.total_xp,
        analysis_report: analysis.analysis_short,
        strategic_insight: analysis.insight,
        xp_breakdown: analysis.xp_breakdown,
      };

      const { data: insertedLog, error: logError } = await supabase
        .from("logs")
        .insert(newLogData)
        .select()
        .single();

      if (logError) throw logError;

      // Step B: Update Profile (XP, Stats, Energy, Level, Streak)
      const userStore = useUserStore.getState();
      const levelStore = useLevelStore.getState();
      const currentProfile = userStore.profile;

      if (!currentProfile) throw new Error("Profile not loaded.");

      // --- CALCULATE NEW STATS ---
      const newLifetimeXp =
        (currentProfile.lifetime_xp || 0) + analysis.total_xp;

      // Level Calculation
      const newLevel = await levelStore.calculateLevelFromXp(newLifetimeXp);

      // Streak Calculation
      let newStreak = currentProfile.current_streak || 0;
      if (currentProfile.last_log_date) {
        const lastLogDate = new Date(currentProfile.last_log_date);
        const now = new Date();

        // Normalize to local date strings to clear time differences
        // (Simple reliable day diff)
        const lastDateStr = lastLogDate.toISOString().split("T")[0];
        const todayStr = now.toISOString().split("T")[0];

        if (lastDateStr !== todayStr) {
          // It's a different day. Check if it was yesterday.
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];

          if (lastDateStr === yesterdayStr) {
            newStreak += 1;
          } else {
            // Missed a day (or more)
            newStreak = 1;
          }
        }
        // If same day, streak doesn't increase
      } else {
        // First log ever
        newStreak = 1;
      }

      const newStats = {
        lifetime_xp: newLifetimeXp,
        level: newLevel,
        current_streak: newStreak,
        energy: Math.max(0, (currentProfile.energy || 0) - mpCost),
        str_builder:
          (currentProfile.str_builder || 0) + (analysis.xp_breakdown.STR || 0),
        int_architect:
          (currentProfile.int_architect || 0) +
          (analysis.xp_breakdown.INT || 0),
        cha_hustler:
          (currentProfile.cha_hustler || 0) + (analysis.xp_breakdown.CHA || 0),
        con_grit:
          (currentProfile.con_grit || 0) + (analysis.xp_breakdown.CON || 0),
        wis_zen:
          (currentProfile.wis_zen || 0) + (analysis.xp_breakdown.WIS || 0),
        last_log_date: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(newStats)
        .eq("id", userId);

      if (profileError) {
        // Rollback Log
        console.error("Profile update failed, rolling back log...");
        await supabase.from("logs").delete().eq("id", insertedLog.id);
        throw profileError;
      }

      // Success - Update Stores
      await get().fetchLogs(userId);
      await userStore.fetchProfile(userId);

      set({ isLoading: false });
      return analysis;
    } catch (error: any) {
      console.error("addLog failed:", error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  clearLogs: () => {
    set({ logs: [], error: null, isLoading: false });
  },
}));
