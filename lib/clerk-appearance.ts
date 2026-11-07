import { dark } from "@clerk/ui/themes";

// Clerk dark theme as the base, with variables and element styles mapped onto
// the app's CSS variables (see app/globals.css). No hardcoded colors.
export const clerkAppearance = {
  theme: dark,
  variables: {
    colorBackground: "var(--bg-surface)",
    colorInput: "var(--bg-elevated)",
    colorInputForeground: "var(--text-primary)",
    colorForeground: "var(--text-primary)",
    colorMutedForeground: "var(--text-muted)",
    colorMuted: "var(--bg-subtle)",
    colorNeutral: "var(--text-primary)",
    colorPrimary: "var(--text-primary)",
    colorPrimaryForeground: "var(--bg-base)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    colorWarning: "var(--state-warning)",
    colorBorder: "var(--border-default)",
    colorRing: "var(--accent-primary)",
    colorShadow: "var(--bg-base)",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    borderRadius: "var(--radius)",
  },
  elements: {
    // Rounded floating card with a soft shadow.
    cardBox: {
      borderRadius: "1.5rem",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)",
      boxShadow: "0 24px 64px var(--bg-base)",
      overflow: "hidden",
    },
    card: {
      backgroundColor: "transparent",
      boxShadow: "none",
      border: "none",
    },
    footer: { backgroundColor: "transparent", background: "transparent" },
    headerTitle: { fontWeight: 600 },
    // Filled, borderless inputs.
    formFieldInput: {
      backgroundColor: "var(--bg-elevated)",
      border: "1px solid transparent",
      borderRadius: "0.625rem",
      boxShadow: "none",
      minHeight: "2.5rem",
    },
    formButtonPrimary: {
      backgroundColor: "var(--bg-subtle)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-subtle)",
      "&:hover": { backgroundColor: "var(--bg-elevated)" },
      borderRadius: "0.625rem",
      minHeight: "2.5rem",
      boxShadow: "none",
      fontWeight: 500,
    },
    // Outlined social buttons.
    socialButtonsBlockButton: {
      backgroundColor: "transparent",
      border: "1px solid var(--border-default)",
      borderRadius: "0.625rem",
      minHeight: "2.5rem",
      boxShadow: "none",
    },
    footerActionLink: { textDecoration: "underline" },
    dividerLine: { backgroundColor: "var(--border-default)" },
    dividerText: { color: "var(--text-muted)", textTransform: "uppercase" },
  },
};
