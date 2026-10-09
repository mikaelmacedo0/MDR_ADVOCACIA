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
        navy: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d9ec',
          300: '#94bfe0',
          400: '#5e9ed0',
          500: '#3880c0',
          600: '#2766a5',
          700: '#1e5187',
          800: '#1c4570',
          900: '#0f294a',
          950: '#0a192f',
        },
        juridico: {
          dark: '#0B192C',
          primary: '#1E3E62',
          accent: '#006699',
          gold: '#C5A059',
          slate: '#475569',
          light: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
