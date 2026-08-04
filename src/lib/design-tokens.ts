/* ─── Lucent Premium Design Tokens ─── */
/* Single source of truth for all design values */

export const tokens = {
  color: {
    primary: "#2D5A3D",
    primaryLight: "#3D7A52",
    primaryDark: "#1E3D2A",
    primaryGhost: "rgba(45, 90, 61, 0.06)",
    primaryGlow: "rgba(45, 90, 61, 0.12)",
    primarySubtle: "rgba(45, 90, 61, 0.04)",

    accent: "#7C6BEA",
    accentLight: "#9B8DF0",
    accentDark: "#5B4BC7",
    accentGhost: "rgba(124, 107, 234, 0.08)",
    accentGlow: "rgba(124, 107, 234, 0.15)",

    rose: "#E8B4B8",
    roseGhost: "rgba(232, 180, 184, 0.10)",

    bg: "#FAFBFC",
    bgWarm: "#F5F3F0",
    bgCard: "#FFFFFF",
    bgElevated: "#FFFFFF",
    bgOverlay: "rgba(250, 251, 252, 0.92)",

    text: "#1A1D21",
    textSecondary: "#5A5F6B",
    textMuted: "#9CA3AF",
    textInverse: "#FFFFFF",

    border: "#E5E7EB",
    borderLight: "#F0F1F3",
    borderFocus: "#2D5A3D",

    success: "#2D5A3D",
    successBg: "rgba(45, 90, 61, 0.08)",
    successFg: "#1E3D2A",
    warning: "#D97706",
    warningBg: "rgba(217, 119, 6, 0.08)",
    warningFg: "#92400E",
    error: "#DC2626",
    errorBg: "rgba(220, 38, 38, 0.08)",
    errorFg: "#991B1B",
  },

  shadow: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.02)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.02)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.12)",
    glow: "0 0 20px rgba(45, 90, 61, 0.12)",
    glowAccent: "0 0 20px rgba(124, 107, 234, 0.15)",
  },

  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
    full: "9999px",
  },

  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
  },

  font: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
    heading: "var(--font-geist-sans)",
  },

  transition: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    smooth: "300ms cubic-bezier(0.16, 1, 0.3, 1)",
    spring: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
    slow: "500ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

/* ─── Convenience color object matching the old C pattern ─── */
export const C = tokens.color;
