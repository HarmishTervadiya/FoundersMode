import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { runAsync } from "../utils/storeHelpers";

// Inferred from VaultStore usage
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
  // stats might be in xp_breakdown or separate columns in logs table?
  // VaultStore migration mapped them to xp_breakdown, but also seemingly inserted directly if columns exist.
  // We'll stick to what we saw in migration: "logs" table insert.
}

interface LogState {
  logs: Log[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLogs: (userId: string) => Promise<void>;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,

  fetchLogs: async (userId: string) => {
    // If we already have logs, we might want to refresh silently or just return
    // For now, let's fetch always to be fresh
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

  clearLogs: () => {
    set({ logs: [], error: null, isLoading: false });
  },
}));
