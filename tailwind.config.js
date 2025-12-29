/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eth-purple': '#8B5CF6',
        'eth-pink': '#EC4899',
        'eth-green': '#10B981',
        'mumbai-orange': '#F97316',
      }
    },
  },
  plugins: [],
}
