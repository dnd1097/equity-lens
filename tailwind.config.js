/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1C2E',
          50: '#E8EDF3',
          100: '#C5D1DF',
          200: '#9EB3C8',
          300: '#7796B1',
          400: '#5E82A0',
          500: '#456E90',
          600: '#375C7A',
          700: '#274A64',
          800: '#1A374E',
          900: '#0F1C2E',
        },
        teal: {
          DEFAULT: '#14B8A6',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        sky: {
          accent: '#0EA5E9',
        },
        slategray: {
          bg: '#F8F9FB',
          50: '#F1F4F8',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#475569',
        },
        amber: {
          accent: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 28, 46, 0.04), 0 4px 12px 0 rgba(15, 28, 46, 0.06)',
        'card-hover': '0 4px 8px 0 rgba(15, 28, 46, 0.08), 0 12px 28px 0 rgba(15, 28, 46, 0.12)',
        'card-active': '0 2px 6px 0 rgba(20, 184, 166, 0.15), 0 8px 20px 0 rgba(20, 184, 166, 0.10)',
      },
      borderRadius: {
        card: '12px',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'toast-in': 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-out': 'toastOut 0.2s ease-in forwards',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        toastIn: {
          '0%': { transform: 'translateY(16px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        toastOut: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
