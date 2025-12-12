import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '../lib/storage';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  currentStep: number;
  totalSteps: number;

  // Actions
  completeOnboarding: () => void;
  setStep: (step: number) => void;
  resetOnboarding: () => void; // For debugging/testing
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  // 1. Synchronously read from MMKV on init (Fast!)
  hasSeenOnboarding: storage.getBoolean(STORAGE_KEYS.HAS_SEEN_ONBOARDING) ?? false,
  currentStep: 0,
  totalSteps: 3,

  completeOnboarding: () => {
    // Persist to disk
    storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, true);
    // Update memory
    set({ hasSeenOnboarding: true });
  },

  setStep: (step) => set({ currentStep: step }),

  resetOnboarding: () => {
    storage.remove(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
    set({ hasSeenOnboarding: false, currentStep: 0 });
  },
}));