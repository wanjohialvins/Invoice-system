/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}", // cover TypeScript files
  ],
  theme: {
    extend: {
      colors: {
        softgray: "#f2f2f2",
        accentblue: "#1e40af",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
