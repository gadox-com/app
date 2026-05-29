/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          50:  '#f8f9fa',
          100: '#f0f1f3',
          200: '#e2e4e8',
          300: '#c4c8cf',
          400: '#8f96a3',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // GadoX verde — substitui laranja em todo o sistema
        orange: {
          50:  '#f0faf0',
          100: '#dcf5d8',
          200: '#b8eaaf',
          300: '#8dd97f',
          400: '#6dcc54',
          500: '#58C734',
          600: '#45a827',
          700: '#1E5A09',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}