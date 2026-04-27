/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream:   { DEFAULT: "#F5F0E8", 50: "#FDFBF7", 100: "#F5F0E8", 200: "#EDE4D0" },
        forest:  { DEFAULT: "#1C3A2F", 50: "#E8F0EC", 100: "#C2D6CC", 400: "#3D7A61", 600: "#2A5444", 800: "#1C3A2F", 900: "#0F1F19" },
        gold:    { DEFAULT: "#C9A84C", 100: "#F7EDD5", 400: "#DDB96A", 600: "#C9A84C", 800: "#8A6E2A" },
        obsidian:{ DEFAULT: "#0D0F14", 50: "#1A1D25", 100: "#13151C", 200: "#0D0F14" },
        amber:   { DEFAULT: "#F59E0B", 400: "#FBBF24", 600: "#D97706" },
        slate:   { 700: "#334155", 800: "#1E293B", 900: "#0F172A" },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        body:    ["'DM Sans'", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
        dash:    ["'Sora'", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up":    "fadeUp 0.7s ease forwards",
        "fade-in":    "fadeIn 0.5s ease forwards",
        "slide-left": "slideLeft 0.6s ease forwards",
        "shimmer":    "shimmer 2s infinite",
        "float":      "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:    { from: { opacity: 0, transform: "translateY(30px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideLeft: { from: { opacity: 0, transform: "translateX(40px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        shimmer:   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float:     { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-12px)" } },
        pulseGlow: { "0%,100%": { boxShadow: "0 0 20px rgba(201,168,76,0.3)" }, "50%": { boxShadow: "0 0 40px rgba(201,168,76,0.6)" } },
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};