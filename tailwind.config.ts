import type { Config } from 'tailwindcss';

const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
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
          soft: rgb('--brand-soft'),
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
      },
      borderRadius: { md: '12px', lg: '18px', xl: '24px' },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(var(--ink) / 0.04)',
        sm: '0 1px 3px 0 rgb(var(--ink) / 0.06), 0 1px 2px -1px rgb(var(--ink) / 0.06)',
        md: '0 8px 20px -6px rgb(var(--ink) / 0.10), 0 2px 6px -2px rgb(var(--ink) / 0.06)',
        lg: '0 24px 48px -12px rgb(var(--ink) / 0.16), 0 4px 12px -4px rgb(var(--ink) / 0.08)',
        glow: '0 10px 30px -8px rgb(var(--brand) / 0.35)',
        'glow-lg': '0 20px 50px -12px rgb(var(--brand) / 0.40)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(.22,.61,.36,1)' },
    },
  },
  plugins: [],
} satisfies Config;
