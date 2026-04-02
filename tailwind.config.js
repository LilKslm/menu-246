/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'apple-blue': '#007AFF',
        'apple-blue-dark': '#0062CC',
        'apple-gray': '#F2F2F7',
        'apple-gray-2': '#E5E5EA',
        'apple-gray-3': '#D1D1D6',
        'apple-dark': '#1C1C1E',
        'apple-secondary': '#636366',
        'apple-tertiary': '#8E8E93',
        'apple-red': '#FF3B30',
        'apple-green': '#34C759',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Helvetica Neue',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        apple: '0 2px 12px rgba(0,0,0,0.08)',
        'apple-md': '0 4px 24px rgba(0,0,0,0.12)',
        'apple-lg': '0 8px 40px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
}
