import { getUserFriendlyErrorMessage } from './errorHandler';

// Type for Supabase response objects
type SupabaseResponse = {
  data?: unknown;
  error: any;
  [key: string]: any;
};

export async function runAsync<T>(
  set: (state: Partial<any>) => void,
  operation: () => Promise<SupabaseResponse>
): Promise<{ data: T | null; error: string | null }> {
  // 1. Start Loading
  set({ isLoading: true, error: null });

  try {
    // 2. Execute Operation
    const result = await operation();

    // 3. Handle Supabase-style Error Objects ( { error: ... } )
    if (result.error) {
      const errorMessage = getUserFriendlyErrorMessage(result.error);
      console.error('[Supabase Error] Raw:', result.error.message, '| Friendly:', errorMessage);
      set({ isLoading: false, error: errorMessage });
      return { data: null, error: errorMessage };
    }

    // 4. Handle Success
    set({ isLoading: false });
    return { data: result.data as T, error: null };
  } catch (err: any) {
    // 5. Handle Unexpected Thrown Errors
    const crashMessage = getUserFriendlyErrorMessage(err);
    console.error('[System Error] Raw:', err.message, '| Friendly:', crashMessage);
    set({ isLoading: false, error: crashMessage });
    return { data: null, error: crashMessage };
  }
}
