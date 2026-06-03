import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Types
interface VaultUser {
  secret_key: string;
  legacy_id: string;
  claimed_at: string | null;
  claimed_by: string | null;
}

interface VaultLog {
  id: string;
  legacy_user_id: string | null;
  content: string | null;
  created_at: string | null;
  difficulty_tier: number | null;
  total_fp_awarded: number | null;
  total_xp_awarded: number | null;
  analysis_report: string | null;
  strategic_insight: string | null;
  xp_breakdown: any;
  str_builder: number | null;
  int_architect: number | null;
  cha_hustler: number | null;
  wis_zen: number | null;
  con_grit: number | null;
}

export interface VaultValidationResult {
  exists: boolean;
  isClaimed: boolean;
  legacyId?: string;
  claimedBy?: string;
  error?: string;
}

export interface MigratedStats {
  logsCount: number;
  totalXp: number;
  strBuilder: number;
  intArchitect: number;
  chaHustler: number;
  wisZen: number;
  conGrit: number;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
}

export interface ClaimResult {
  success: boolean;
  stats: MigratedStats | null;
  error?: string;
}

interface VaultState {
  isValidating: boolean;
  isMigrating: boolean;
  migrationProgress: number;
  migrationMessage: string;
  error: string | null;
  migratedStats: MigratedStats | null;

  // Actions
  validateVaultKey: (secretKey: string) => Promise<VaultValidationResult>;
  claimVaultKey: (secretKey: string, userId: string, currentLevel: number) => Promise<ClaimResult>;
  setMigrationProgress: (progress: number, message: string) => void;
  resetState: () => void;
}

// Calculate level from XP (simple formula: level = floor(sqrt(xp / 100)) + 1)
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isValidating: false,
  isMigrating: false,
  migrationProgress: 0,
  migrationMessage: '',
  error: null,
  migratedStats: null,

  setMigrationProgress: (progress: number, message: string) => {
    set({ migrationProgress: progress, migrationMessage: message });
  },

  resetState: () => {
    set({
      isValidating: false,
      isMigrating: false,
      migrationProgress: 0,
      migrationMessage: '',
      error: null,
      migratedStats: null,
    });
  },

  validateVaultKey: async (secretKey: string): Promise<VaultValidationResult> => {
    set({ isValidating: true, error: null });

    const normalizedKey = secretKey.toUpperCase().trim();
    console.log('[VaultStore] Validating key:', normalizedKey);
    console.log('[VaultStore] Original input:', secretKey);

    try {
      // Query vault_users for matching secret_key
      console.log('[VaultStore] Querying vault_users table...');
      const { data, error } = await supabase
        .from('vault_users')
        .select('*')
        .eq('secret_key', normalizedKey)
        .maybeSingle();

      console.log('[VaultStore] Query result - data:', data);
      console.log('[VaultStore] Query result - error:', error);

      if (error) {
        console.error('[VaultStore] Database error:', error.message);
        set({ isValidating: false, error: error.message });
        return { exists: false, isClaimed: false, error: error.message };
      }

      if (!data) {
        console.log('[VaultStore] No matching record found for key:', normalizedKey);
        set({ isValidating: false });
        return { exists: false, isClaimed: false };
      }

      const vaultUser = data as VaultUser;
      const isClaimed = vaultUser.claimed_by !== null;

      set({ isValidating: false });
      return {
        exists: true,
        isClaimed,
        legacyId: vaultUser.legacy_id,
        claimedBy: vaultUser.claimed_by || undefined,
      };
    } catch (err: any) {
      set({ isValidating: false, error: err.message });
      return { exists: false, isClaimed: false, error: err.message };
    }
  },

  claimVaultKey: async (
    secretKey: string,
    userId: string,
    currentLevel: number
  ): Promise<ClaimResult> => {
    set({ isMigrating: true, error: null, migrationProgress: 0 });

    try {
      const { setMigrationProgress } = get();

      // Step 1: Validate key again
      setMigrationProgress(10, 'VALIDATING VAULT KEY...');
      await new Promise((r) => setTimeout(r, 500));

      const { data: vaultUser, error: vaultError } = await supabase
        .from('vault_users')
        .select('*')
        .eq('secret_key', secretKey.toUpperCase().trim())
        .single();

      if (vaultError || !vaultUser) {
        set({ isMigrating: false, error: 'Vault key not found' });
        return { success: false, stats: null, error: 'Vault key not found' };
      }

      if (vaultUser.claimed_by) {
        set({ isMigrating: false, error: 'Vault key already claimed' });
        return {
          success: false,
          stats: null,
          error: 'Vault key already claimed',
        };
      }

      // Step 2: Get legacy_id
      const legacyId = vaultUser.legacy_id;
      setMigrationProgress(20, 'DECRYPTING LEGACY DATA...');
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: Fetch vault_logs by legacy_user_id
      setMigrationProgress(35, 'LOCATING ARCHIVED RECORDS...');
      await new Promise((r) => setTimeout(r, 600));

      const { data: vaultLogs, error: logsError } = await supabase
        .from('vault_logs')
        .select('*')
        .eq('legacy_user_id', legacyId);

      if (logsError) {
        set({ isMigrating: false, error: logsError.message });
        return { success: false, stats: null, error: logsError.message };
      }

      const logs = (vaultLogs || []) as VaultLog[];
      setMigrationProgress(50, `RESTORING ${logs.length} LEGACY ENTRIES...`);
      await new Promise((r) => setTimeout(r, 800));

      // Step 4: Calculate totals from logs
      let totalXp = 0;
      let strBuilder = 0;
      let intArchitect = 0;
      let chaHustler = 0;
      let wisZen = 0;
      let conGrit = 0;

      for (const log of logs) {
        totalXp += log.total_xp_awarded || 0;
        strBuilder += log.str_builder || 0;
        intArchitect += log.int_architect || 0;
        chaHustler += log.cha_hustler || 0;
        wisZen += log.wis_zen || 0;
        conGrit += log.con_grit || 0;
      }

      console.log('[VaultStore] Calculated totals - XP:', totalXp, 'Stats:', {
        strBuilder,
        intArchitect,
        chaHustler,
        wisZen,
        conGrit,
      });

      setMigrationProgress(50, 'CALCULATING LEGACY XP...');
      await new Promise((r) => setTimeout(r, 1000));

      // Step 5: Calculate new level FIRST
      const newLevel = calculateLevel(totalXp);
      const levelsGained = Math.max(0, newLevel - currentLevel);
      console.log(
        '[VaultStore] Level calculation - Previous:',
        currentLevel,
        'New:',
        newLevel,
        'Gained:',
        levelsGained
      );

      setMigrationProgress(60, 'RESTORING YOUR LEGACY...');
      await new Promise((r) => setTimeout(r, 1000));

      // Step 6: Update profiles FIRST (before inserting logs due to FK constraint)
      setMigrationProgress(70, 'UPDATING PROFILE STATS...');
      await new Promise((r) => setTimeout(r, 800));

      const derivedUsername = `VK_${secretKey.toUpperCase().trim()}`;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: derivedUsername,
          lifetime_xp: totalXp,
          level: newLevel,
          str_builder: strBuilder,
          int_architect: intArchitect,
          cha_hustler: chaHustler,
          wis_zen: wisZen,
          con_grit: conGrit,
        })
        .eq('id', userId);

      if (profileError) {
        console.error('[VaultStore] Profile update failed:', profileError.message);
        set({ isMigrating: false, error: profileError.message });
        return { success: false, stats: null, error: profileError.message };
      }

      console.log('[VaultStore] Profile updated successfully');

      // Step 7: NOW migrate logs (profile exists, FK constraint satisfied)
      if (logs.length > 0) {
        setMigrationProgress(80, `MIGRATING ${logs.length} LOG ENTRIES...`);
        await new Promise((r) => setTimeout(r, 800));

        // Map vault_logs to logs table format (user_id instead of legacy_user_id)
        const migratedLogs = logs.map((log) => ({
          user_id: userId, // New user's ID
          content: log.content || '',
          created_at: log.created_at,
          difficulty_tier: log.difficulty_tier,
          total_fp_awarded: log.total_fp_awarded,
          total_xp_awarded: log.total_xp_awarded,
          analysis_report: log.analysis_report,
          strategic_insight: log.strategic_insight,
          xp_breakdown: log.xp_breakdown,
        }));

        console.log('[VaultStore] Inserting', migratedLogs.length, 'logs into logs table');

        const { error: insertError } = await supabase.from('logs').insert(migratedLogs);

        if (insertError) {
          console.error('[VaultStore] Failed to insert logs:', insertError.message);
          // Continue anyway - profile update is more important
        } else {
          console.log('[VaultStore] Successfully migrated', logs.length, 'logs');
        }
      }

      setMigrationProgress(90, 'FINALIZING VAULT CLAIM...');
      await new Promise((r) => setTimeout(r, 800));

      // Step 8: Mark vault_users as claimed
      const { error: claimError } = await supabase
        .from('vault_users')
        .update({
          claimed_by: userId,
          claimed_at: new Date().toISOString(),
        })
        .eq('secret_key', secretKey.toUpperCase().trim());

      if (claimError) {
        console.error('[VaultStore] Claim update failed:', claimError.message);
        set({ isMigrating: false, error: claimError.message });
        return { success: false, stats: null, error: claimError.message };
      }

      console.log('[VaultStore] Vault key claimed successfully');

      setMigrationProgress(100, 'MIGRATION COMPLETE!');
      await new Promise((r) => setTimeout(r, 1500));

      const stats: MigratedStats = {
        logsCount: logs.length,
        totalXp,
        strBuilder,
        intArchitect,
        chaHustler,
        wisZen,
        conGrit,
        previousLevel: currentLevel,
        newLevel,
        levelsGained,
      };

      set({ isMigrating: false, migratedStats: stats });
      return { success: true, stats };
    } catch (err: any) {
      set({ isMigrating: false, error: err.message });
      return { success: false, stats: null, error: err.message };
    }
  },
}));
