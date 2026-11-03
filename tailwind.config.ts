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
        brand: {
          navy: "#14263D",
          navyDark: "#0B1522",
          navyLight: "#1E3A5F",
          teal: "#0D9488",
          tealLight: "#14B8A6",
          gold: "#D4A853",
          goldLight: "#E5C175",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          text: "#0F172A",
          muted: "#64748B",
          border: "#E2E8F0",
          error: "#DC2626",
          success: "#16A34A",
          warning: "#F59E0B",
        },
      },
      fontFamily: {
        bengali: ["var(--font-hind-siliguri)", "sans-serif"],
      },
      screens: {
        xs: "475px",
        print: { raw: "print" },
      },
    },
  },
  plugins: [],
};

export default config;

