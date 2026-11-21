/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        devflow: {
          bg: '#0B0F19',
          surface: '#111827',
          card: '#131D31',
          'card-hover': '#18243D',
          border: '#1E293B',
          'border-light': '#2A3B55',
          accent: '#38BDF8', // Cyan/Sky
          violet: '#818CF8', // Indigo/Violet
          emerald: '#34D399',
          amber: '#FBBF24',
          rose: '#F87171',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
