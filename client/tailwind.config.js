/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F97316', // Orange
        secondary: '#6C757D',
        light: '#FFF7ED', // Orange-50
        border: '#FED7AA', // Orange-200
        danger: '#DC3545',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter or similar modern font
      }
    },
  },
  plugins: [],
}
