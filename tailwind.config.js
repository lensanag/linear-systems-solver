/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0095AA',
          dark: '#007a8a',
          light: '#47a2af',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#666666',
          light: '#999999',
          dark: '#333333',
        },
        background: '#f8f9fa',
        surface: '#ffffff',
        border: '#e5e5e5',
      },
      fontFamily: {
        sans: ['Source Sans Pro', 'system-ui', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
    },
  },
  plugins: [],
}