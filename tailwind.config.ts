import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#071018",
        surface: "#101A24",
        "surface-raised": "#17232F",
        border: {
          DEFAULT: "#262E39",
          strong: "#39424F",
        },
        ink: {
          DEFAULT: "#E7EBF0",
          muted: "#8B96A5",
          faint: "#5B6472",
        },
        risk: {
          critical: "#E5484D",
          high: "#E5484D",
          medium: "#F5A623",
          low: "#3DD68C",
          info: "#4C9FE8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
      },
      keyframes: {
        "row-in": {
          "0%": { transform: "translateY(-8px)", opacity: "0", backgroundColor: "rgba(76,159,232,0.18)" },
          "60%": { opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1", backgroundColor: "transparent" },
        },
      },
      animation: {
        "row-in": "row-in 900ms ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};

export default config;
