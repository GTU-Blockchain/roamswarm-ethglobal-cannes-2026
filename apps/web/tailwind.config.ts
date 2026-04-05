import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'roam-gold': '#F5A623',
        'roam-dark': '#0A0A0F',
        'roam-glass': 'rgba(255, 255, 255, 0.1)',
        'roam-accent': '#7C3AED',
        'roam-surface': '#12121A',
      },
      backgroundImage: {
        'gradient-roam': 'linear-gradient(135deg, #0A0A0F 0%, #12121A 50%, #1A1A2E 100%)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 166, 35, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(245, 166, 35, 0)' },
        },
      },
    },
  },
  plugins: [require('tailwind-scrollbar')({ nocompatible: true })],
};

export default config;
