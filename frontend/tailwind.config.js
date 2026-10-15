/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* Shared semantic palette for the application UI. */
      colors: {
        "primary":                    "#2563eb",
        "on-primary":                 "#ffffff",
        "primary-container":          "#eaf1fb",
        "on-primary-container":       "#1e3a5f",
        "primary-fixed":              "#dbeafe",
        "primary-fixed-dim":          "#bfdbfe",
        "on-primary-fixed":           "#172554",
        "on-primary-fixed-variant":   "#1e3a8a",
        "secondary":                  "#475569",
        "on-secondary":               "#ffffff",
        "secondary-container":        "#e8eff8",
        "on-secondary-container":     "#334155",
        "secondary-fixed":            "#e8eff8",
        "secondary-fixed-dim":        "#cbd5e1",
        "on-secondary-fixed":         "#1e293b",
        "on-secondary-fixed-variant": "#334155",
        "tertiary":                   "#c2410c",
        "on-tertiary":                "#ffffff",
        "tertiary-container":         "#fff1e8",
        "on-tertiary-container":      "#7c2d12",
        "tertiary-fixed":             "#ffedd5",
        "tertiary-fixed-dim":          "#fed7aa",
        "on-tertiary-fixed":          "#431407",
        "on-tertiary-fixed-variant":  "#7c2d12",
        "error":                      "#b42318",
        "on-error":                   "#ffffff",
        "error-container":            "#fee4e2",
        "on-error-container":         "#912018",
        "background":                 "#f7f9fc",
        "on-background":              "#182230",
        "surface":                    "#f7f9fc",
        "on-surface":                 "#182230",
        "surface-variant":            "#e2e8f0",
        "on-surface-variant":         "#475569",
        "surface-dim":                "#e7ecf2",
        "surface-bright":             "#ffffff",
        "surface-tint":               "#2563eb",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#f8fafc",
        "surface-container":          "#f1f5f9",
        "surface-container-high":     "#e9eff5",
        "surface-container-highest":  "#dfe7ef",
        "outline":                    "#64748b",
        "outline-variant":            "#cbd5e1",
        "inverse-surface":            "#1e293b",
        "inverse-on-surface":         "#f8fafc",
        "inverse-primary":            "#bfdbfe",
      },

      /* ─── Border Radius ─── */
      borderRadius: {
        DEFAULT: "0.625rem",
        lg:      "0.875rem",
        xl:      "1rem",
        "2xl":   "1.25rem",
        "3xl":   "1.5rem",
        full:    "9999px",
      },

      /* ─── Layout Spacing Tokens ─── */
      spacing: {
        "unit":                     "8px",
        "gutter":                   "24px",
        "section-padding-mobile":   "24px",
        "section-padding-desktop":  "64px",
        "sidebar-width":            "280px",
        "container-max":            "1280px",
      },

      /* ─── Typography: Font Families ─── */
      fontFamily: {
        "body-md":          ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "body-lg":          ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "headline-md":      ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "display-lg":       ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "display-lg-mobile":["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "label-sm":         ["'Hanken Grotesk'", "system-ui", "sans-serif"],
      },

      /* ─── Typography: Font Sizes (with line-height & weight) ─── */
      fontSize: {
        "body-md":          ["16px", { lineHeight: "1.6",  fontWeight: "400" }],
        "body-lg":          ["18px", { lineHeight: "1.6",  fontWeight: "400" }],
        "headline-md":      ["24px", { lineHeight: "1.4",  fontWeight: "600" }],
        "display-lg":       ["48px", { lineHeight: "1.2",  letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile":["32px", { lineHeight: "1.25", fontWeight: "700" }],
        "label-sm":         ["13px", { lineHeight: "1",    letterSpacing: "0.05em",  fontWeight: "600" }],
      },

      /* ─── Ambient Shadows ─── */
      boxShadow: {
        "ambient":       "0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.04)",
        "ambient-hover": "0 8px 24px rgba(15, 23, 42, 0.09)",
      },
    },
  },
  plugins: [],
}
