/**
 * Theme Configuration for FoundersMode
 *
 * Currently hardcoded theme selection. Change CURRENT_THEME to switch themes.
 * Future: Add UI toggle and persist to MMKV storage.
 */

import type { LucideIcon } from "lucide-react-native";
import { TrendingUp, Trophy, Zap } from "lucide-react-native";

// Available theme keys
export type ThemeKey = "emerald" | "cyan" | "violet";

// ========================================
// HARDCODED THEME SELECTION - CHANGE HERE
// ========================================
export const CURRENT_THEME: ThemeKey = "violet";

// Theme display names
export const THEME_NAMES: Record<ThemeKey, string> = {
  emerald: "Emerald",
  cyan: "Cyan",
  violet: "Violet",
};

// CSS class to apply for each theme (matches global.css)
export const THEME_CLASSES: Record<ThemeKey, string> = {
  emerald: "", // Default, no class needed
  cyan: "theme-cyan",
  violet: "theme-violet",
};

// Onboarding step data
export interface OnboardingStep {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  terminal: string;
  highlight: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: Zap,
    title: "YOUR WORK IS NOT INVISIBLE",
    subtitle: "Every bug fixed. Every email sent. Every line of code matters.",
    terminal: "TRACKING_PROTOCOL_INIT",
    highlight: "// Stop losing progress to the void",
  },
  {
    icon: TrendingUp,
    title: "LEVEL UP YOUR GRIND",
    subtitle:
      "Transform daily work into measurable growth. See your evolution in real-time.",
    terminal: "GROWTH_METRICS_ONLINE",
    highlight: "// Effort > Outcome. Always.",
  },
  {
    icon: Trophy,
    title: "BUILD YOUR LEGACY",
    subtitle:
      "Join founders who track what matters: consistency, resilience, and progress.",
    terminal: "LEGACY_MODE_ACTIVATED",
    highlight: "// Your journey starts now",
  },
];
