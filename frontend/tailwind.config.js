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
        display: ['Archivo Black', 'Space Grotesk', 'sans-serif'],
        sans: ['Space Grotesk', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      colors: {
        background: "#F5F3EF",
        surface: "#FFFFFF",
        neo: {
          bg: "#F5F3EF",
          card: "#FFFFFF",
          black: "#000000",
          green: "#00E575",
          yellow: "#FFE600",
          red: "#FF4949",
          blue: "#38BDF8",
          purple: "#A78BFA",
          cream: "#FAF8F5",
          muted: "#4A4A4A",
          border: "#000000",
        },
        jade: {
          DEFAULT: "#00E575",
          dim: "rgba(0, 229, 117, 0.15)",
        },
        copper: {
          DEFAULT: "#FFE600",
          dim: "rgba(255, 230, 0, 0.15)",
        },
        alert: {
          red: "#FF4949",
          dim: "rgba(255, 73, 73, 0.15)",
        },
        primary: "#00E575",
        secondary: "#333333",
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #000000',
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
        'neo-xl': '8px 8px 0px 0px #000000',
      },
    },
  },
  plugins: [],
};
