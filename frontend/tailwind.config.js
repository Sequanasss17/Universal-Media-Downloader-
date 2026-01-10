/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'in': 'in 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in-from-top-4': 'slide-in-from-top-4 0.5s ease-out',
        'slide-in-from-bottom-4': 'slide-in-from-bottom-4 0.5s ease-out',
        'slide-in-from-bottom-6': 'slide-in-from-bottom-6 0.5s ease-out',
        'slide-in-from-bottom-8': 'slide-in-from-bottom-8 0.5s ease-out',
        'slide-in-from-left-2': 'slide-in-from-left-2 0.3s ease-out',
        'slide-in-from-left-4': 'slide-in-from-left-4 0.5s ease-out',
        'zoom-in': 'zoom-in 0.5s ease-out',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top-4': {
          '0%': { opacity: '0', transform: 'translateY(-1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-bottom-4': {
          '0%': { opacity: '0', transform: 'translateY(1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-bottom-6': {
          '0%': { opacity: '0', transform: 'translateY(1.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-bottom-8': {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-left-2': {
          '0%': { opacity: '0', transform: 'translateX(-0.5rem)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-from-left-4': {
          '0%': { opacity: '0', transform: 'translateX(-1rem)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
