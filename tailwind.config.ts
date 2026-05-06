import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0b0a08",
          800: "#11100d",
          700: "#17130f",
          600: "#1e1a15",
          500: "#25201a",
        },
        gold: {
          500: "#b99a5b",
          400: "#c7aa67",
          300: "#d3bd82",
        },
        warm: {
          400: "#e5d6b0",
          300: "#c8b88a",
          200: "#8b8076",
          100: "#5c5750",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
