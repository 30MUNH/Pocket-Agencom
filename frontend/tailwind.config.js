/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* Modern Tailored Design System: Clean White Canvas, Slate Typography & #FFCED2 Soft Accent */
      colors: {
        "primary": "#0f172a", // Slate 900 (Đậm, sắc sảo, cao cấp)
        "on-primary": "#ffffff",
        "primary-container": "#f8fafc", // Nền khối phụ nhẹ nhàng
        "on-primary-container": "#0f172a",
        "primary-fixed": "#ffffff",
        "primary-fixed-dim": "#f1f5f9",
        "on-primary-fixed": "#0f172a",
        "on-primary-fixed-variant": "#334155",
        "secondary": "#475569", // Slate 600 (Màu chữ phụ/icon phụ rất rõ ràng)
        "on-secondary": "#ffffff",
        "secondary-container": "#f1f5f9",
        "on-secondary-container": "#1e293b",
        "secondary-fixed": "#f8fafc",
        "secondary-fixed-dim": "#e2e8f0",
        "on-secondary-fixed": "#0f172a",
        "on-secondary-fixed-variant": "#475569",
        "tertiary": "#FFCED2", // Điểm nhấn hồng pastel thanh lịch
        "on-tertiary": "#0f172a", // Chữ tương phản cao sắc nét trên nền hồng
        "tertiary-container": "#ffffff", // Nền khối chuẩn trắng, không bị ám hồng
        "on-tertiary-container": "#0f172a",
        "tertiary-fixed": "#ffffff", // Nền input/khối sạch sẽ
        "tertiary-fixed-dim": "#f8fafc",
        "on-tertiary-fixed": "#0f172a",
        "on-tertiary-fixed-variant": "#475569",
        "error": "#ef4444",
        "on-error": "#ffffff",
        "error-container": "#fef2f2",
        "on-error-container": "#991b1b",
        "background": "#ffffff", // Nền chính trắng 100%
        "on-background": "#0f172a", // Chữ đọc cực kỳ rõ, chuẩn tỉ lệ tương phản WCAG AAA
        "surface": "#ffffff",
        "on-surface": "#0f172a",
        "surface-variant": "#f8fafc",
        "on-surface-variant": "#64748b", // Chữ phụ/thời gian/mô tả dễ đọc (Slate 500)
        "surface-dim": "#ffffff",
        "surface-bright": "#ffffff",
        "surface-tint": "#64748b", // Slate 500 cho nhãn sắc nét (thay vì hồng nhạt khó đọc)
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#ffffff",
        "surface-container": "#f8fafc",
        "surface-container-high": "#f1f5f9",
        "surface-container-highest": "#e2e8f0",
        "outline": "#cbd5e1", // Viền mảnh tinh tế, rõ ràng (Slate 300)
        "outline-variant": "#e2e8f0",
        "inverse-surface": "#0f172a",
        "inverse-on-surface": "#ffffff",
        "inverse-primary": "#0f172a",
        "accent-pink": "#FFCED2",
        "petal-pink": "#FFCED2",
        "mist-pink": "#fff5f6",
      },

      /* ─── Border Radius ─── */
      borderRadius: {
        DEFAULT: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        full: "9999px",
      },

      /* ─── Layout Spacing Tokens ─── */
      spacing: {
        "unit": "8px",
        "gutter": "24px",
        "section-padding-mobile": "24px",
        "section-padding-desktop": "64px",
        "sidebar-width": "280px",
        "container-max": "1280px",
      },

      /* ─── Typography: Font Families ─── */
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        "body-md": ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "body-lg": ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "headline-md": ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "display-lg": ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "display-lg-mobile": ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "label-sm": ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },

      /* ─── Typography: Font Sizes (with line-height & weight) ─── */
      fontSize: {
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        "display-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["32px", { lineHeight: "1.25", fontWeight: "700" }],
        "label-sm": ["13px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
      },

      /* ─── Ambient Shadows ─── */
      boxShadow: {
        "ambient": "0 4px 24px rgba(255, 143, 163, 0.08)",
        "ambient-hover": "0 8px 32px rgba(255, 143, 163, 0.12)",
      },
    },
  },
  plugins: [],
}
