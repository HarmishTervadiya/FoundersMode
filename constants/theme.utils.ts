/**
 * Shared Theme Utilities for FoundersMode
 *
 * Provides consistent NativeWind classes and color values across all screens.
 * Import this file instead of duplicating theme definitions.
 */

import { CURRENT_THEME, type ThemeKey } from "./theme.config";

// Helper function for joining classnames
export function cx(...parts: (string | boolean | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

// NativeWind class tokens for each theme
export const themeClasses = {
  emerald: {
    // Background
    bgClass: "bg-slate-950",
    accentBg: "bg-emerald-500",
    glowClass: "bg-emerald-500/10",

    // Text
    textClass: "text-emerald-400",
    textDimClass: "text-emerald-500/40",
    mutedTextClass: "text-emerald-300/80",

    // Borders
    borderClass: "border-emerald-500/30",

    // Buttons
    buttonBg: "bg-emerald-500/20",
    buttonBorder: "border-emerald-500/50",
    buttonTextClass: "text-emerald-400",
    buttonSolidClass: "bg-emerald-500/20 border-emerald-500/50",

    // Progress
    progressFilled: "bg-emerald-500",
    progressDim: "bg-emerald-500/40",

    // Danger (for logout, etc)
    dangerBg: "bg-red-500/20",
    dangerBorder: "border-red-500/50",
    dangerText: "text-red-400",

    // Icon color (hex for lucide-react-native)
    iconColor: "#34d399",
    placeholder: "#34d399",
  },
  cyan: {
    bgClass: "bg-slate-950",
    accentBg: "bg-cyan-500",
    glowClass: "bg-cyan-500/10",

    textClass: "text-cyan-400",
    textDimClass: "text-cyan-500/40",
    mutedTextClass: "text-cyan-300/80",

    borderClass: "border-cyan-500/30",

    buttonBg: "bg-cyan-500/20",
    buttonBorder: "border-cyan-500/50",
    buttonTextClass: "text-cyan-400",
    buttonSolidClass: "bg-cyan-500/20 border-cyan-500/50",

    progressFilled: "bg-cyan-500",
    progressDim: "bg-cyan-500/40",

    dangerBg: "bg-red-500/20",
    dangerBorder: "border-red-500/50",
    dangerText: "text-red-400",

    iconColor: "#22d3ee",
    placeholder: "#22d3ee",
  },
  violet: {
    bgClass: "bg-slate-950",
    accentBg: "bg-violet-500",
    glowClass: "bg-violet-500/10",

    textClass: "text-violet-400",
    textDimClass: "text-violet-500/40",
    mutedTextClass: "text-violet-300/80",

    borderClass: "border-violet-500/30",

    buttonBg: "bg-violet-500/20",
    buttonBorder: "border-violet-500/50",
    buttonTextClass: "text-violet-400",
    buttonSolidClass: "bg-violet-500/20 border-violet-500/50",

    progressFilled: "bg-violet-500",
    progressDim: "bg-violet-500/40",

    dangerBg: "bg-red-500/20",
    dangerBorder: "border-red-500/50",
    dangerText: "text-red-400",

    iconColor: "#a78bfa",
    placeholder: "#a78bfa",
  },
} as const;

// Raw color values for StyleSheet usage
export const themeColors = {
  emerald: {
    primary: "#34d399",
    primaryDim: "#34d39980",
    primaryBg: "rgba(52, 211, 153, 0.1)",
    primaryBorder: "#34d39940",
    secondary: "#6ee7b7",
    bg: "#020617",
  },
  cyan: {
    primary: "#22d3ee",
    primaryDim: "#22d3ee80",
    primaryBg: "rgba(34, 211, 238, 0.1)",
    primaryBorder: "#22d3ee40",
    secondary: "#67e8f9",
    bg: "#020617",
  },
  violet: {
    primary: "#a78bfa",
    primaryDim: "#a78bfa80",
    primaryBg: "rgba(167, 139, 250, 0.1)",
    primaryBorder: "#a78bfa40",
    secondary: "#c4b5fd",
    bg: "#020617",
  },
} as const;

// Current theme exports
export const theme = themeClasses[CURRENT_THEME];
export const colors = themeColors[CURRENT_THEME];

// Type exports for theme structure
export type ThemeClasses = (typeof themeClasses)[ThemeKey];
export type ThemeColors = (typeof themeColors)[ThemeKey];
