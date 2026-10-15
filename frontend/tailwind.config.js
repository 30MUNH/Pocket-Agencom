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
        "primary":                    "#be185d",
        "on-primary":                 "#ffffff",
        "primary-container":          "#fce7f3",
        "on-primary-container":       "#831843",
        "primary-fixed":              "#fbcfe8",
        "primary-fixed-dim":          "#f9a8d4",
        "on-primary-fixed":           "#500724",
        "on-primary-fixed-variant":   "#9d174d",
        "secondary":                  "#9d174d",
        "on-secondary":               "#ffffff",
        "secondary-container":        "#ffffff",
        "on-secondary-container":     "#831843",
        "secondary-fixed":            "#ffffff",
        "secondary-fixed-dim":        "#ffffff",
        "on-secondary-fixed":         "#831843",
        "on-secondary-fixed-variant": "#9d174d",
        "tertiary":                   "#be185d",
        "on-tertiary":                "#ffffff",
        "tertiary-container":         "#ffffff",
        "on-tertiary-container":      "#831843",
        "tertiary-fixed":             "#ffffff",
        "tertiary-fixed-dim":          "#ffffff",
        "on-tertiary-fixed":          "#831843",
        "on-tertiary-fixed-variant":  "#9d174d",
        "error":                      "#b42318",
        "on-error":                   "#ffffff",
        "error-container":            "#fee4e2",
        "on-error-container":         "#912018",
        "background":                 "#ffffff",
        "on-background":              "#831843",
        "surface":                    "#ffffff",
        "on-surface":                 "#831843",
        "surface-variant":            "#ffffff",
        "on-surface-variant":         "#9d174d",
        "surface-dim":                "#ffffff",
        "surface-bright":             "#ffffff",
        "surface-tint":               "#be185d",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#ffffff",
        "surface-container":          "#ffffff",
        "surface-container-high":     "#ffffff",
        "surface-container-highest":  "#ffffff",
        "outline":                    "#806675",
        "outline-variant":            "#f2c6d8",
        "inverse-surface":            "#831843",
        "inverse-on-surface":         "#ffffff",
        "inverse-primary":            "#f9a8d4",
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
