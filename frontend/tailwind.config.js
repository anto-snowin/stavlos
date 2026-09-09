/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      colors: {
        background: "#06090f",
        surface: "#0a0f1a",
        "surface-raised": "#111827",
        "surface-overlay": "#1a2235",
        primary: "#2dd4bf",
        secondary: "#818cf8",
        accent: {
          teal: "#2dd4bf",
          cyan: "#22d3ee",
          emerald: "#34d399",
          rose: "#fb7185",
          amber: "#fbbf24",
          indigo: "#818cf8",
          violet: "#a78bfa",
        },
      },
      borderColor: {
        subtle: "rgba(255, 255, 255, 0.04)",
        default: "rgba(255, 255, 255, 0.07)",
        emphasis: "rgba(255, 255, 255, 0.12)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
        "slide-right": "slideInRight 0.3s ease-out both",
        "count-up": "countUp 0.5s ease-out both",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 4px rgba(45, 212, 191, 0.3)' },
          '50%': { boxShadow: '0 0 12px rgba(45, 212, 191, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
