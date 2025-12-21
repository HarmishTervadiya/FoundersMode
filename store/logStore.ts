import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { ai, LogAnalysisResult } from "../services/ai";
import { toLocalYMD } from "../utils/dateHelpers";
import { runAsync } from "../utils/storeHelpers";
import { useLevelStore as levelStore } from "./levelStore";
import { useUserStore as userStore } from "./userStore";

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

      // 1. Check for Existing Daily Log (Using LOCAL time)
      const todayStr = toLocalYMD(new Date());
      console.log(`[addLog] TodayStr: ${todayStr}`);

      const existingDailyLog = logs.find((log) => {
        const logDateStr = toLocalYMD(log.created_at);
        console.log(
          `[addLog] Checking log ${log.id}: ${log.created_at} -> ${logDateStr} === ${todayStr}?`
        );
        return logDateStr === todayStr;
      });
      console.log(
        `[addLog] Existing log found: ${existingDailyLog?.id || "None"}`
      );

      // Calculate CURRENT daily total (if exists)
      const todayTotalFP = existingDailyLog
        ? existingDailyLog.total_fp_awarded || 0
        : 0;

      if (todayTotalFP >= 100) {
        throw new Error(
          "Daily Focus Limit Reached (100/100). Rest now, founder."
        );
      }

      // 2. AI Analysis
      const analysis = await ai.analyzeLog(content);

      // 3. Apply Logic caps and costs
      let finalFP = analysis.total_fp;
      let finalXp = analysis.total_xp;
      let finalBreakdown = { ...analysis.xp_breakdown };

      // Clamp to remaining daily limit
      const remainingFP = 100 - todayTotalFP;

      if (finalFP > remainingFP) {
        // Calculate scaling ratio
        const ratio = finalFP > 0 ? remainingFP / finalFP : 0;

        // Clamp FP
        finalFP = remainingFP;

        // Scale XP & Breakdown proportionally
        finalXp = Math.floor(finalXp * ratio);
        (
          Object.keys(finalBreakdown) as Array<keyof typeof finalBreakdown>
        ).forEach((key) => {
          finalBreakdown[key] = Math.floor((finalBreakdown[key] || 0) * ratio);
        });
      }

      // MP Cost Logic
      let mpCost = 0;
      if (analysis.total_fp > 79) {
        mpCost = 15;
      } else if (analysis.total_fp > 65) {
        mpCost = 5;
      }

      // 4. Atomic-ish DB Updates
      // Step A: Determine if Insert or Update

      const currentEnergy = userStore.getState().profile?.energy || 0;
      const isDebuffed = currentEnergy <= 0;

      if (isDebuffed) {
        finalXp = Math.floor(finalXp * 0.5);
        (
          Object.keys(finalBreakdown) as Array<keyof typeof finalBreakdown>
        ).forEach((key) => {
          finalBreakdown[key] = Math.floor((finalBreakdown[key] || 0) * 0.5);
        });
      }

      let resultLog;
      let isInsert = false;

      if (existingDailyLog) {
        // --- UPDATE EXISTING LOG ---
        console.log(`[addLog] UPDATING existing log: ${existingDailyLog.id}`);

        // Concatenate Content
        const newContent = `${existingDailyLog.content}\n\n${content}`;
        const newTotalFP = (existingDailyLog.total_fp_awarded || 0) + finalFP;
        const newTotalXP = (existingDailyLog.total_xp_awarded || 0) + finalXp;

        // Merge Breakdowns
        const mergedBreakdown = { ...(existingDailyLog.xp_breakdown || {}) };
        (
          Object.keys(finalBreakdown) as Array<keyof typeof finalBreakdown>
        ).forEach((key) => {
          mergedBreakdown[key] =
            (mergedBreakdown[key] || 0) + (finalBreakdown[key] || 0);
        });

        // Attempt UPDATE
        const { data: updatedData, error: updateError } = await supabase
          .from("logs")
          .update({
            content: newContent,
            total_fp_awarded: newTotalFP,
            total_xp_awarded: newTotalXP,
            xp_breakdown: mergedBreakdown,
            analysis_report: analysis.analysis_short,
            strategic_insight: analysis.insight,
          })
          .eq("id", existingDailyLog.id)
          .select()
          .maybeSingle();

        if (updateError) throw updateError;

        if (!updatedData) {
          // Resilience: Update failed (0 rows). Check if blocked by RLS or missing.
          console.warn("Update returned 0 rows. Checking existence...");
          const { data: checkData } = await supabase
            .from("logs")
            .select("id")
            .eq("id", existingDailyLog.id)
            .maybeSingle();

          if (checkData) {
            // Exists but blocked? Insert separate log to strictly avoid data loss.
            console.warn(
              "Log exists but RLS blocked update. Inserting separate entry."
            );
            isInsert = true; // Fallback to insert logic below
          } else {
            // Missing. Restore.
            console.warn("Log missing. Restoring merged log.");
            const restoreLogData = {
              user_id: userId,
              content: newContent,
              difficulty_tier: analysis.difficulty_tier,
              total_fp_awarded: newTotalFP,
              total_xp_awarded: newTotalXP,
              analysis_report: analysis.analysis_short,
              strategic_insight: analysis.insight,
              xp_breakdown: mergedBreakdown,
              // Note: We don't preserve original created_at here easily without more logic,
              // but a new created_at is fine for a "restore".
            };
            const { data: restored, error: resError } = await supabase
              .from("logs")
              .insert(restoreLogData)
              .select()
              .single();
            if (resError) throw resError;
            resultLog = restored;
          }
        } else {
          resultLog = updatedData;
        }
      } else {
        // --- INSERT NEW LOG ---
        console.log("[addLog] INSERTING new log (No existing log for today)");
        isInsert = true;
      }

      if (isInsert) {
        // Standard Insertion
        const newLogData = {
          user_id: userId,
          content: content,
          difficulty_tier: analysis.difficulty_tier,
          total_fp_awarded: finalFP,
          total_xp_awarded: finalXp,
          analysis_report: analysis.analysis_short,
          strategic_insight: analysis.insight,
          xp_breakdown: finalBreakdown,
        };

        const { data: insertedData, error: insertError } = await supabase
          .from("logs")
          .insert(newLogData)
          .select()
          .single();

        if (insertError) throw insertError;
        resultLog = insertedData;
      }

      // Step B: Update Profile (XP, Stats, Energy, Level, Streak)
      const currentProfile = userStore.getState().profile;

      if (!currentProfile) throw new Error("Profile not loaded.");

      // --- CALCULATE NEW STATS ---
      // We ALWAYS add the *delta* (finalXp, finalBreakdown) to the profile.

      const newLifetimeXp = (currentProfile.lifetime_xp || 0) + finalXp;

      // Level Calculation
      const newLevel = await levelStore
        .getState()
        .calculateLevelFromXp(newLifetimeXp);
      const newTitle = levelStore.getState().getLevelTitle(newLevel);

      // Streak Calculation
      let newStreak = currentProfile.current_streak || 0;

      // Use the last known log from the store state (before this new/updated one is fetched)
      // This is safer than profile date which might be out of sync.
      const latestLog = logs[0]; // Assumes logs are ordered desc

      if (!latestLog) {
        // No previous logs found -> First log ever
        newStreak = 1;
      } else {
        const lastDateStr = toLocalYMD(latestLog.created_at);
        const todayStr = toLocalYMD(new Date());

        if (lastDateStr !== todayStr) {
          // Different day
          const now = new Date();
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const yesterdayStr = toLocalYMD(yesterday);

          if (lastDateStr === yesterdayStr) {
            newStreak += 1;
          } else {
            // Missed a day (or more)
            // Logic: If 'existingDailyLog' was found, we effectively "already logged today", so current_streak should be safe.
            // If it wasn't found, this is the FIRST log of the day.
            // If strict gap detected, reset.
            if (!existingDailyLog) {
              newStreak = 1;
            }
          }
        }
        // If same day, streak doesn't increase
      }

      // --- MP CALCULATION ---
      let calculatedEnergy = Math.max(0, (currentProfile.energy || 0) - mpCost);
      const wisReward = finalBreakdown.WIS || 0;
      calculatedEnergy = calculatedEnergy + wisReward;
      calculatedEnergy = Math.min(100, calculatedEnergy);

      // const newStats = {
      //   lifetime_xp: newLifetimeXp,
      //   level: newLevel,
      //   current_streak: newStreak,
      //   energy: calculatedEnergy,
      //   str_builder:
      //     (currentProfile.str_builder || 0) + (finalBreakdown.STR || 0),
      //   int_architect:
      //     (currentProfile.int_architect || 0) + (finalBreakdown.INT || 0),
      //   cha_hustler:
      //     (currentProfile.cha_hustler || 0) + (finalBreakdown.CHA || 0),
      //   con_grit: (currentProfile.con_grit || 0) + (finalBreakdown.CON || 0),
      //   wis_zen: (currentProfile.wis_zen || 0) + (finalBreakdown.WIS || 0),
      //   last_log_date: new Date().toISOString(),
      //   title: newTitle,
      // };

      let newStats = {};
      if (!newTitle) {
        newStats = {
          lifetime_xp: newLifetimeXp,
          level: newLevel,
          current_streak: newStreak,
          energy: calculatedEnergy,
          str_builder:
            (currentProfile.str_builder || 0) + (finalBreakdown.STR || 0),
          int_architect:
            (currentProfile.int_architect || 0) + (finalBreakdown.INT || 0),
          cha_hustler:
            (currentProfile.cha_hustler || 0) + (finalBreakdown.CHA || 0),
          con_grit: (currentProfile.con_grit || 0) + (finalBreakdown.CON || 0),
          wis_zen: (currentProfile.wis_zen || 0) + (finalBreakdown.WIS || 0),
          last_log_date: new Date().toISOString(),
        };
      } else {
        newStats = {
          lifetime_xp: newLifetimeXp,
          level: newLevel,
          current_streak: newStreak,
          energy: calculatedEnergy,
          str_builder:
            (currentProfile.str_builder || 0) + (finalBreakdown.STR || 0),
          int_architect:
            (currentProfile.int_architect || 0) + (finalBreakdown.INT || 0),
          cha_hustler:
            (currentProfile.cha_hustler || 0) + (finalBreakdown.CHA || 0),
          con_grit: (currentProfile.con_grit || 0) + (finalBreakdown.CON || 0),
          wis_zen: (currentProfile.wis_zen || 0) + (finalBreakdown.WIS || 0),
          last_log_date: new Date().toISOString(),
          ...(newTitle && { title: newTitle }),
        };
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(newStats as any)
        .eq("id", userId);

      if (profileError) {
        // Rollback Log
        console.error("Profile update failed, rolling back log...");
        // Fallback rollback: If we inserted a NEW log (resultLog), delete it.
        // If we updated an existing one, real rollback is hard (would need to subtract stats),
        // but since profile failed, maybe just alert user?
        // Prioritizing data integrity of 'Log exists but profile failed' -> usually better to delete log to avoid 'phantom' logs without stats.
        if (resultLog && (isInsert || !existingDailyLog)) {
          // Only delete if we created a NEW row
          await supabase.from("logs").delete().eq("id", resultLog.id);
        }
        throw profileError;
      }

      // Success - Update Stores
      await get().fetchLogs(userId);
      await userStore.getState().fetchProfile(userId);

      set({ isLoading: false });
      console.log("[addLog] Operation completed successfully.");
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
