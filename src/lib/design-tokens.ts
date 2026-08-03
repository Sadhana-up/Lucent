/* ─── Lucent Premium Design Tokens ─── */
/* Single source of truth for all design values */

export const tokens = {
  color: {
    primary: "#4a6741",
    primaryLight: "#6b8c62",
    primaryDark: "#3a5233",
    primaryGhost: "rgba(74, 103, 65, 0.08)",
    primaryGlow: "rgba(74, 103, 65, 0.15)",

    accent: "#c4956a",
    accentLight: "#d4b08f",
    accentDark: "#a67a4f",
    accentGhost: "rgba(196, 149, 106, 0.10)",

    bg: "#faf8f5",
    bgWarm: "#f5f0eb",
    bgCard: "#ffffff",
    bgElevated: "#ffffff",
    bgOverlay: "rgba(250, 248, 245, 0.92)",

    text: "#2d2a26",
    textLight: "#6b6560",
    textMuted: "#9c9590",
    textInverse: "#ffffff",

    border: "#e8e4df",
    borderLight: "#f0ece7",
    borderFocus: "#4a6741",

    success: "#4a6741",
    successBg: "#e8f0e6",
    successFg: "#3a5233",
    warning: "#c4956a",
    warningBg: "#faf0e6",
    warningFg: "#78350f",
    error: "#b54a4a",
    errorBg: "#fde8e8",
    errorFg: "#991b1b",
  },

  shadow: {
    xs: "0 1px 2px rgba(45, 42, 38, 0.04)",
    sm: "0 1px 3px rgba(45, 42, 38, 0.06), 0 1px 2px rgba(45, 42, 38, 0.04)",
    md: "0 4px 6px -1px rgba(45, 42, 38, 0.06), 0 2px 4px -2px rgba(45, 42, 38, 0.04)",
    lg: "0 10px 15px -3px rgba(45, 42, 38, 0.06), 0 4px 6px -4px rgba(45, 42, 38, 0.04)",
    xl: "0 20px 25px -5px rgba(45, 42, 38, 0.06), 0 8px 10px -6px rgba(45, 42, 38, 0.04)",
    glow: "0 0 20px rgba(74, 103, 65, 0.15)",
    glowAccent: "0 0 20px rgba(196, 149, 106, 0.15)",
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
    smooth: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
    slow: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

/* ─── Convenience color object matching the old C pattern ─── */
/* Use this to replace `const C = { ... }` in every component */
export const C = tokens.color;
