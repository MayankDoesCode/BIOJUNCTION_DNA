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
          50: '#fbfaf3',
          100: '#f5f3dc',
          200: '#eae6c2',
          300: '#d5bf86', // gold
          400: '#bf9e5a',
          500: '#a71d31', // crimson
          600: '#8e1829',
          700: '#731322',
          800: '#5a0e1a',
          900: '#3f0d12', // maroon
          950: '#28080c',
        },
        navy: {
          700: '#dedbb5',
          800: '#eae7cc',
          850: '#f3f2dc',
          900: '#fbfaf3', // light ivory card
          950: '#f1f0cc', // light cream background
        },
        cyan: {
          50: '#3f0d12',  // maroon (primary text)
          100: '#4a1218',
          200: '#5f1620',
          300: '#771b27',
          400: '#8d775f', // taupe (secondary text)
          500: '#a71d31', // crimson (accent)
          600: '#8e182a',
          700: '#731322',
          800: '#5a0e1a',
          900: '#3f0d12',
          950: '#2b090d',
        },
        field: {
          online: '#2dd4bf', // Teal glow
          offline: '#a71d31', // Crimson
          syncing: '#d5bf86', // Gold
        },
        luxury: {
          maroon: '#3f0d12',
          crimson: '#a71d31',
          cream: '#f1f0cc',
          gold: '#d5bf86',
          taupe: '#8d775f',
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
        'subtle': '0 2px 8px rgba(63, 13, 18, 0.06)',
        'card': '0 4px 20px rgba(63, 13, 18, 0.06), 0 0 0 1px rgba(213, 191, 134, 0.3)',
        'card-hover': '0 10px 30px rgba(167, 29, 49, 0.12), 0 0 0 1px rgba(167, 29, 49, 0.4)',
        'glass': '0 4px 25px rgba(63, 13, 18, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.9)',
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
