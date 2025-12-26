/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}", // cover TypeScript files
  ],
  theme: {
    extend: {
      colors: {
        softgray: "#f8fafc", // Lighter, cleaner gray
        accentblue: "#0099ff", // Vibrant Brand Blue from Logo
        brand: {
          DEFAULT: "#0099ff", // The blue from the logo
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
