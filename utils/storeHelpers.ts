// Type for Supabase response objects
// This type is flexible enough to handle both direct data responses
// and nested auth responses (e.g., { data: { user, session } })
// Using 'unknown' for data allows compatibility with Supabase's union types
// Note: 'data' is optional since some Supabase methods (like signOut) only return { error }
type SupabaseResponse = {
  data?: unknown;
  error: any;
  [key: string]: any;
};

/**
 * A standardized wrapper for Zustand store actions.
 * Handles loading states, error catching, and Supabase error extraction.
 * @param set - The Zustand 'set' function
 * @param operation - The async function to execute (should return a Supabase response)
 * @returns Object containing { data, error }
 */
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
    // Supabase often returns { error } instead of throwing
    if (result.error) {
      const errorMessage = result.error.message || "Database operation failed";
      console.error("[Supabase Error]:", errorMessage);
      set({ isLoading: false, error: errorMessage });
      return { data: null, error: errorMessage };
    }

    // 4. Handle Success - extract data from Supabase response
    set({ isLoading: false });
    return { data: result.data as T, error: null };
  } catch (err: any) {
    // 5. Handle Unexpected Thrown Errors (Network crashes, bad logic)
    const crashMessage = err.message || "An unexpected system error occurred";
    console.error("[System Error]:", crashMessage);
    set({ isLoading: false, error: crashMessage });
    return { data: null, error: crashMessage };
  }
}
