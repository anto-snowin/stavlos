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
        background: "#0D1321",
        surface: "#16213E",
        jade: {
          DEFAULT: "#35C48F",
          dim: "rgba(53, 196, 143, 0.12)",
        },
        copper: {
          DEFAULT: "#D9A24B",
          dim: "rgba(217, 162, 75, 0.12)",
        },
        alert: {
          red: "#E5484D",
          dim: "rgba(229, 72, 77, 0.12)",
        },
        glass: {
          fill: "rgba(255, 255, 255, 0.06)",
          hover: "rgba(255, 255, 255, 0.09)",
          border: "rgba(255, 255, 255, 0.12)",
          subtle: "rgba(255, 255, 255, 0.06)",
        },
        primary: "#35C48F",
        secondary: "#94A3B8",
        accent: {
          teal: "#35C48F", // mapped to Jade
          cyan: "#22d3ee",
          emerald: "#35C48F",
          rose: "#E5484D", // mapped to Alert Red
          amber: "#D9A24B", // mapped to Copper
          indigo: "#818cf8",
          violet: "#a78bfa",
        },
      },
      borderColor: {
        glass: "rgba(255, 255, 255, 0.12)",
        "glass-subtle": "rgba(255, 255, 255, 0.06)",
        subtle: "rgba(255, 255, 255, 0.06)",
        default: "rgba(255, 255, 255, 0.12)",
        emphasis: "rgba(255, 255, 255, 0.18)",
      },
      animation: {
        "rack-focus": "rackFocus 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-up": "fadeInUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
        "count-up": "countUp 0.5s ease-out both",
      },
      keyframes: {
        rackFocus: {
          "0%": { filter: "blur(18px)", opacity: "0.5", transform: "scale(0.99)" },
          "100%": { filter: "blur(0px)", opacity: "1", transform: "scale(1)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        countUp: {
          from: { opacity: "0", transform: "translateY(3px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
