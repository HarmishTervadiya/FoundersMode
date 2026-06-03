import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase.types';

// Type from supabase schema
type Level = Database['public']['Tables']['levels']['Row'];

export interface LevelInfo {
  level: number;
  title: string | null;
  minXp: number;
  xpToNext: number | null;
}

interface LevelState {
  levelsData: Map<number, LevelInfo>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLevelData: (levels: number[]) => Promise<void>;
  fetchAllLevels: () => Promise<void>;
  getLevelTitle: (level: number) => string | null;
  getLevelInfo: (level: number) => LevelInfo | null;
  calculateLevelFromXp: (lifetimeXp: number) => Promise<number>;
}

export const useLevelStore = create<LevelState>((set, get) => ({
  levelsData: new Map(),
  isLoading: false,
  error: null,

  fetchLevelData: async (levels: number[]) => {
    if (levels.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.from('levels').select('*').in('level', levels);

      if (error) {
        console.error('[LevelStore] Failed to fetch levels:', error.message);
        set({ isLoading: false, error: error.message });
        return;
      }

      const levelsMap = new Map(get().levelsData);
      for (const lvl of (data || []) as Level[]) {
        levelsMap.set(lvl.level, {
          level: lvl.level,
          title: lvl.title,
          minXp: lvl.min_xp,
          xpToNext: lvl.xp_to_next,
        });
      }

      console.log('[LevelStore] Fetched level data for levels:', levels);
      set({ levelsData: levelsMap, isLoading: false });
    } catch (err: any) {
      console.error('[LevelStore] Error:', err.message);
      set({ isLoading: false, error: err.message });
    }
  },

  fetchAllLevels: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('[LevelStore] Failed to fetch all levels:', error.message);
        set({ isLoading: false, error: error.message });
        return;
      }

      const levelsMap = new Map<number, LevelInfo>();
      for (const lvl of (data || []) as Level[]) {
        levelsMap.set(lvl.level, {
          level: lvl.level,
          title: lvl.title,
          minXp: lvl.min_xp,
          xpToNext: lvl.xp_to_next,
        });
      }

      console.log('[LevelStore] Fetched all levels:', levelsMap.size);
      set({ levelsData: levelsMap, isLoading: false });
    } catch (err: any) {
      console.error('[LevelStore] Error:', err.message);
      set({ isLoading: false, error: err.message });
    }
  },

  getLevelTitle: (level: number) => {
    const levelInfo = get().levelsData.get(level);
    return levelInfo?.title || null;
  },

  getLevelInfo: (level: number) => {
    return get().levelsData.get(level) || null;
  },

  calculateLevelFromXp: async (lifetimeXp: number) => {
    // Ensure we have level data
    if (get().levelsData.size === 0) {
      await get().fetchAllLevels();
    }

    const levelsData = get().levelsData;
    let calculatedLevel = 1;

    // Find highest level where min_xp <= lifetimeXp
    for (const [level, info] of levelsData) {
      if (lifetimeXp >= info.minXp && level > calculatedLevel) {
        calculatedLevel = level;
      }
    }

    return calculatedLevel;
  },
}));
