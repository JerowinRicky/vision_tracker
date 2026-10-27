/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Two-color brand system
        brand: {
          blue: '#2563EB',
          'blue-hover': '#1D4ED8',
          'blue-light': '#EFF6FF',
          purple: '#7C3AED',
          'purple-hover': '#6D28D9',
          'purple-light': '#F5F3FF',
        },
        // Neutral UI palette
        app: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          text: '#0F172A',
          muted: '#64748B',
          border: '#E2E8F0',
          disabled: '#CBD5E1',
        }
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        modal: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        badge: '6px',
        btn: '8px',
        input: '8px',
        card: '12px',
        modal: '12px',
      }
    },
  },
  plugins: [],
}
