import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EEF2F7',
          100: '#D5E0ED',
          200: '#ADBFDB',
          300: '#849FCA',
          400: '#5C7FB8',
          500: '#3A5F9A',
          600: '#2D4B7A',
          700: '#1E3A5F',
          800: '#162C48',
          900: '#0E1D30',
          950: '#070E18',
        },
        gold: {
          50: '#FDF9EE',
          100: '#FAF0D0',
          200: '#F4DFA1',
          300: '#EDCC72',
          400: '#E6BA43',
          500: '#C9A84C',
          600: '#B8860B',
          700: '#9A6F09',
          800: '#7C5807',
          900: '#5E4205',
        },
        cream: {
          50: '#FEFDFB',
          100: '#F8F6F0',
          200: '#F0EDE3',
          300: '#E8E3D5',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
