import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" }
    },
    extend: {
      borderRadius: { lg: "0.5rem", xl: "0.75rem", "2xl": "1rem" },
      colors: {
        border: "hsl(214 32% 91%)",
        input: "hsl(214 32% 91%)",
        ring: "hsl(215 20% 65%)",
        background: "white",
        foreground: "hsl(222 47% 11%)",
        primary: { DEFAULT: "hsl(222 89% 56%)", foreground: "white" },
        secondary: { DEFAULT: "hsl(210 40% 96%)", foreground: "hsl(222 47% 11%)" }
      }
    }
  },
  plugins: []
} satisfies Config
