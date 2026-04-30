/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#1a1a1a',
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
