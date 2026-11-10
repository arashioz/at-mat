/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e9f2f8',
          100: '#c8e2f2',
          500: '#2d85cd',
          600: '#1a4b6c',
          700: '#082438',
        },
      },
      fontFamily: {
        sans: ['Peyda', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
