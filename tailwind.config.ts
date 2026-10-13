import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        marca: {
          50: "#f4f8f1",
          100: "#e4efdb",
          200: "#c8dfb6",
          300: "#a4c988",
          400: "#7fae60",
          500: "#5e9142",
          600: "#4b7a3f",
          700: "#3b6132",
          800: "#2f4e28",
          900: "#273f22",
          950: "#13220f",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        header: "0 1px 0 0 rgb(16 24 40 / 0.04), 0 4px 16px -8px rgb(39 63 34 / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
