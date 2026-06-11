/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        awt: {
          navy: '#0f172a',
          teal: '#0f766e',
          gold: '#f59e0b'
        }
      }
    }
  },
  plugins: []
}
