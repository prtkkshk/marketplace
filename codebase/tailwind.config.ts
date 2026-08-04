import type { Config } from 'tailwindcss';

const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: rgb('--paper'), sunk: rgb('--paper-sunk') },
        surface: { DEFAULT: rgb('--surface'), alt: rgb('--surface-alt') },
        line: { DEFAULT: rgb('--line'), strong: rgb('--line-strong') },
        ink: { DEFAULT: rgb('--ink'), 2: rgb('--ink-2'), 3: rgb('--ink-3') },
        brand: {
          DEFAULT: rgb('--brand'), hover: rgb('--brand-hover'),
          wash: rgb('--brand-wash'), line: rgb('--brand-line'),
        },
        accent: {
          DEFAULT: rgb('--accent'), bright: rgb('--accent-bright'),
          wash: rgb('--accent-wash'), line: rgb('--accent-line'),
        },
        whats: { DEFAULT: rgb('--whats'), hover: rgb('--whats-hover') },
        danger: { DEFAULT: rgb('--danger'), wash: rgb('--danger-wash') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
      },
      borderRadius: { md: '12px', lg: '18px', xl: '26px' },
      boxShadow: {
        1: '0 1px 2px rgb(26 22 20 / 0.05)',
        2: '0 4px 16px -6px rgb(26 22 20 / 0.14)',
        3: '0 18px 48px -18px rgb(26 22 20 / 0.30)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(.22,.61,.36,1)' },
    },
  },
  plugins: [],
} satisfies Config;
