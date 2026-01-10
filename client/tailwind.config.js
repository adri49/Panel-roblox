/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        roblox: {
          red: '#E31837',
          dark: '#232527',
          gray: '#393B3D'
        }
      }
    },
  },
  plugins: [],
}
