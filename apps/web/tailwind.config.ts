import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#FFFFFF',
        gray: {
          900: '#050505',
          800: '#1F1F1F',
          700: '#2E2E2E'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          'Segoe UI',
          'sans-serif'
        ]
      },
      boxShadow: {
        focus: '0 0 0 4px rgba(255,255,255,0.9)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};

export default config;
