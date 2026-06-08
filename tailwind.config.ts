import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2B7A78",
          light: "#DEF2F1",
          dark: "#1a4d4a",
        },
        accent: {
          DEFAULT: "#3AAFA9",
          bright: "#17c3bc",
        },
        surface: {
          DEFAULT: "#f8fafc",
          2: "#f1f5f9",
          3: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Sora", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease",
        "slide-down": "slideDown 0.3s ease",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
