/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#121212',
          light: '#1e1e1e',
          lighter: '#282828',
          card: '#181818',
          hover: '#252525',
        },
        accent: {
          DEFAULT: '#1db954',
          hover: '#1ed760',
          dark: '#169c46',
        },
        text: {
          primary: '#ffffff',
          secondary: '#b3b3b3',
          muted: '#727272',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
