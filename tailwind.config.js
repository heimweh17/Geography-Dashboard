/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f1f6f2', 100: '#e2eee5', 200: '#c6dbcd', 300: '#a0c0ae',
          400: '#74a68d', 500: '#49876d', 600: '#306e56', 700: '#285b49',
          800: '#214a3d', 900: '#203b33', 950: '#142820',
        },
        mineral: {
          50: '#f6f8f6', 100: '#edf1ed', 200: '#dce3dd', 300: '#c2cdc4',
          400: '#97a59a', 500: '#66756b', 600: '#516057', 700: '#3c4941',
          800: '#29362f', 850: '#222d27', 900: '#1c2620', 950: '#141d18',
        },
      },
      fontFamily: { sans: ['"Segoe UI"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable class-based dark mode
}