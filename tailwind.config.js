/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}", // cover TypeScript files
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        softgray: "#f8fafc",
        accentblue: "#0099ff",
        // Midnight Shadows Palette
        midnight: {
          950: "#1A1A2E", // Main Background (Deepest Navy)
          900: "#16213E", // Sidebar / Header (Dark Blue)
          800: "#0F3460", // Cards / Panels (Blue 2)
          700: "#243b55", // Borders (Computed, or use 800 lighten)
          text: {
            primary: "#F9F9F9", // Crisp White
            secondary: "#B0B0B0", // Soft Gray (Provided previously, keeping for hierarchy)
            muted: "#6B7280"
          },
          accent: "#E94560" // Vibrant Red
        },
        brand: {
          DEFAULT: "#0099ff",
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0099ff",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        }
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
