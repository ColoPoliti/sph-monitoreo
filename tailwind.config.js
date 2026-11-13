/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        principal: '#59B4B4',
        secundario: '#9283BD',
      },
      // Toasts de calidad (arriba al centro): bajan desde arriba y suben al irse
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '70%': { opacity: '1', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-24px)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.35s ease-out both',
        'toast-out': 'toast-out 0.25s ease-in both',
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        montserrat: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
