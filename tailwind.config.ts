import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#EEF0F7',
          100: '#D5D9ED',
          200: '#ABB3DB',
          300: '#818DC9',
          400: '#5767B7',
          500: '#2D41A5',
          600: '#243484',
          700: '#1B2763',
          800: '#121A42',
          900: '#0F1629',
          950: '#080C17',
        },
        teal: {
          50:  '#E0FBF7',
          100: '#B3F5EC',
          200: '#66EBD9',
          300: '#19E0C6',
          400: '#00D4B1',
          500: '#00A88E',
          600: '#007C6A',
          700: '#005047',
          800: '#002823',
          900: '#001412',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'pulse-slow':     { '0%, 100%': { opacity: '0.4' }, '50%': { opacity: '0.8' } },
        'fade-up':        { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'pulse-slow':     'pulse-slow 4s ease-in-out infinite',
        'fade-up':        'fade-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
