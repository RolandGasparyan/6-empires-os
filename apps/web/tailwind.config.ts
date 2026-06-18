import type { Config } from 'tailwindcss';

/**
 * 6-EMPIRE OS — Design System
 * Black Obsidian Glass + Liquid Gold. Apple Vision Pro / JARVIS aesthetic.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#040405',
          900: '#08090c',
          800: '#0d0f14',
          700: '#13161d',
          600: '#1b1f29',
          500: '#262b38',
        },
        gold: {
          50: '#fff9e6',
          100: '#fdedc0',
          200: '#f6d987',
          300: '#eec24a',
          400: '#e3ad28',
          500: '#c8941a',  // primary liquid gold
          600: '#a8790f',
          700: '#7d590b',
        },
        empire: {
          gold: '#e3ad28',
          'gold-bright': '#f6d987',
          'gold-deep': '#a8790f',
          cyan: '#3fe0ff',
          danger: '#ff4d5e',
          success: '#34f5a0',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gold-liquid': 'linear-gradient(135deg, #7d590b 0%, #e3ad28 35%, #f6d987 50%, #e3ad28 65%, #7d590b 100%)',
        'obsidian-radial': 'radial-gradient(ellipse at top, #13161d 0%, #08090c 55%, #040405 100%)',
        'glass-sheen': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 30px -4px rgba(227,173,40,0.45)',
        'gold-glow-lg': '0 0 60px -8px rgba(227,173,40,0.55)',
        glass: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        'gold-flow': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'scan': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        'gold-flow': 'gold-flow 6s ease infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.2,0.6,0.3,1) infinite',
        float: 'float 5s ease-in-out infinite',
        scan: 'scan 4s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
