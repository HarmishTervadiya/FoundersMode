import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { runAsync } from "../utils/storeHelpers";

interface FeedbackState {
  isSubmitting: boolean;
  submitFeedback: (userId: string, content: string) => Promise<boolean>;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  isSubmitting: false,

  submitFeedback: async (userId: string, content: string) => {
    const { error } = await runAsync(set, async () => {
      return await supabase.from("feedbacks").insert({
        user_id: userId,
        content: content,
        // rating: null // We aren't asking for this yet per requirements
      });
    });

    return !error;
  },
}));
