/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* ─── Material 3 Color Palette (from Stitch exports) ─── */
      colors: {
        "primary":                    "#000000",
        "on-primary":                 "#ffffff",
        "primary-container":          "#1e1927",
        "on-primary-container":       "#888193",
        "primary-fixed":              "#e9dff3",
        "primary-fixed-dim":          "#ccc3d7",
        "on-primary-fixed":           "#1e1927",
        "on-primary-fixed-variant":   "#4a4454",
        "secondary":                  "#6d595b",
        "on-secondary":               "#ffffff",
        "secondary-container":        "#f7dcde",
        "on-secondary-container":     "#735f61",
        "secondary-fixed":            "#f7dcde",
        "secondary-fixed-dim":        "#dac0c2",
        "on-secondary-fixed":         "#26181a",
        "on-secondary-fixed-variant": "#544244",
        "tertiary":                   "#000000",
        "on-tertiary":                "#ffffff",
        "tertiary-container":         "#211a1b",
        "on-tertiary-container":      "#8c8182",
        "tertiary-fixed":             "#eddfe0",
        "tertiary-fixed-dim":         "#d0c3c5",
        "on-tertiary-fixed":          "#211a1b",
        "on-tertiary-fixed-variant":  "#4d4546",
        "error":                      "#ba1a1a",
        "on-error":                   "#ffffff",
        "error-container":            "#ffdad6",
        "on-error-container":         "#93000a",
        "background":                 "#f8f9fa",
        "on-background":              "#191c1d",
        "surface":                    "#f8f9fa",
        "on-surface":                 "#191c1d",
        "surface-variant":            "#e1e3e4",
        "on-surface-variant":         "#49454b",
        "surface-dim":                "#d9dadb",
        "surface-bright":             "#f8f9fa",
        "surface-tint":               "#625b6c",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#f3f4f5",
        "surface-container":          "#edeeef",
        "surface-container-high":     "#e7e8e9",
        "surface-container-highest":  "#e1e3e4",
        "outline":                    "#7a767c",
        "outline-variant":            "#cac5cc",
        "inverse-surface":            "#2e3132",
        "inverse-on-surface":         "#f0f1f2",
        "inverse-primary":            "#ccc3d7",
      },

      /* ─── Border Radius ─── */
      borderRadius: {
        DEFAULT: "1rem",
        lg:      "2rem",
        xl:      "3rem",
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
        "ambient":       "0 4px 24px rgba(255, 143, 163, 0.08)",
        "ambient-hover": "0 8px 32px rgba(255, 143, 163, 0.12)",
      },
    },
  },
  plugins: [],
}
