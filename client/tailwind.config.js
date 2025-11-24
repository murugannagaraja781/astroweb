/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Custom font families
    fontFamily: {
      display: ['Playfair Display', 'serif'],
      body: ['Inter', 'sans-serif'],
      accent: ['Cinzel', 'serif'],
    },
    // Custom colors
    extend: {
      colors: {
        space: {
          900: '#0f172a', // Deep Space Blue
          800: '#1e293b', // Space Blue
        },
        purple: {
          600: '#6366f1', // Cosmic Purple
          500: '#8b5cf6', // Light Purple
        },
        gold: {
          500: '#f59e0b', // Gold Accent
          400: '#fbbf24', // Light Gold
        },
      },

      // Animations and keyframes
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'hologram': 'hologram 3s ease-in-out infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        hologram: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
      },

    },

  },
  plugins: [],
}
