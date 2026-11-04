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
      // Sombras con desplazamiento y desenfoque suave, tintadas del neutro piedra (stone-900).
      // `card`: superficies en reposo. `flotante`: lo que va encima de la página (hojas, avisos,
      // diálogos, barra inferior). `boton`: relieve mínimo del botón principal.
      boxShadow: {
        card: "0 1px 2px 0 rgb(28 25 23 / 0.05), 0 2px 8px -2px rgb(28 25 23 / 0.07)",
        flotante: "0 -1px 0 0 rgb(28 25 23 / 0.04), 0 12px 32px -8px rgb(28 25 23 / 0.28)",
        boton: "0 1px 2px 0 rgb(28 25 23 / 0.12), inset 0 1px 0 0 rgb(255 255 255 / 0.12)",
        header: "0 1px 0 0 rgb(16 24 40 / 0.04), 0 4px 16px -8px rgb(39 63 34 / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
