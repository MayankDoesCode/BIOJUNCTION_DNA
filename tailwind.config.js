/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e0f2fe',
          100: '#bae6fd',
          200: '#7dd3fc',
          300: '#38bdf8',
          400: '#0ea5e9',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#041829',
        },
        navy: {
          700: '#1e293b',
          800: '#0f172a',
          850: '#0b1120',
          900: '#050b14',
          950: '#02060d',
        },
        field: {
          online: '#2dd4bf', // Teal glow
          offline: '#f43f5e', // Pink/red glow
          syncing: '#a855f7', // Purple glow
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'subtle': '0 0 10px rgba(6, 182, 212, 0.1)',
        'card': '0 0 20px rgba(6, 182, 212, 0.15), inset 0 0 20px rgba(6, 182, 212, 0.05)',
        'card-hover': '0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.1)',
        'glass': '0 4px 30px rgba(6, 182, 212, 0.1), inset 0 0 10px rgba(6, 182, 212, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.5))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 15px rgba(6,182,212,0.8))' },
        }
      }
    },
  },
  plugins: [],
};
