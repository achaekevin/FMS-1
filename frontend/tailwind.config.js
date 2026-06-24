/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5bafd',
          400: '#8194fa',
          500: '#6370f4',
          600: '#4f4fe8',
          700: '#413dce',
          800: '#3533a7',
          900: '#2f2f84',
          950: '#1c1c52',
        },
        gold: {
          400: '#f5c842',
          500: '#e9b828',
          600: '#c99a1a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
