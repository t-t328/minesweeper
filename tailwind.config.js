/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 👈 これにより class="dark" の切り替えが有効になります
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}