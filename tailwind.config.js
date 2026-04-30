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
          DEFAULT: '#d4526e',
          dark: '#a83d54',
          light: '#ff8fa8',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#008c7a',
          dark: '#006b5e',
          light: '#33d7c2',
        },
        accent: {
          DEFAULT: '#008c7a',
          foreground: '#ffffff',
        },
        background: '#f7f5dd',
        surface: '#ffffff',
        border: '#d4d0bc',
        muted: {
          DEFAULT: '#ebe8d8',
          foreground: '#4a4a4a',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#4a4a4a',
          muted: '#6b6b6b',
        },
      },
      fontFamily: {
        sans: ['Source Sans Pro', 'system-ui', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
    },
  },
  plugins: [],
}