/**
 * KGP Bazaar v5 — Tailwind theme.
 * Reference copy. Merge into codebase/tailwind.config.ts.
 *
 * Colours read from the CSS custom properties in design/v5/tokens.css using the
 * `<alpha-value>` form, so `bg-accent/10` and `text-ink/55` work. This is why the
 * tokens are RGB triplets rather than hex.
 *
 * The v4 sky/slate palette is DELETED, not extended. Leaving the old scales in
 * place is how v3 drift happened: half the app migrates, half doesn't, and nobody
 * can tell which is intentional. If a `sky-*` or `slate-*` class survives the
 * migration, the build should have nothing to resolve it to.
 */
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // No darkMode key. Dark mode was removed in v4 and is not returning.
  theme: {
    // `colors` REPLACES the default palette rather than extending it, so a stray
    // `bg-sky-600` fails loudly at build time instead of silently rendering blue.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      bg: 'rgb(var(--bg) / <alpha-value>)',
      surface: 'rgb(var(--surface) / <alpha-value>)',
      'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',

      ink: 'rgb(var(--ink) / <alpha-value>)',
      muted: 'rgb(var(--muted) / <alpha-value>)',
      subtle: 'rgb(var(--subtle) / <alpha-value>)',

      line: 'rgb(var(--border) / <alpha-value>)',
      'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',

      accent: 'rgb(var(--accent) / <alpha-value>)',
      'accent-press': 'rgb(var(--accent-press) / <alpha-value>)',
      'accent-wash': 'rgb(var(--accent-wash) / <alpha-value>)',

      success: 'rgb(var(--success) / <alpha-value>)',
      'success-wash': 'rgb(var(--success-wash) / <alpha-value>)',
      danger: 'rgb(var(--danger) / <alpha-value>)',
      'danger-wash': 'rgb(var(--danger-wash) / <alpha-value>)',
    },

    extend: {
      fontFamily: {
        // Archivo only. Inter, Instrument Serif and Plus Jakarta Sans are removed.
        sans: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },

      // Type scale from DESIGN_SYSTEM.md §1. Tracking is baked in so a heading
      // cannot be set without it.
      fontSize: {
        'badge': ['0.5625rem', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '700' }],   //  9px
        'meta': ['0.65625rem', { lineHeight: '1.4' }],                                               // 10.5px
        'label': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '800' }],   // 11px
        'xs': ['0.71875rem', { lineHeight: '1.45' }],                                                // 11.5px
        'sm': ['0.78125rem', { lineHeight: '1.35', letterSpacing: '-0.005em' }],                     // 12.5px
        'base': ['0.8125rem', { lineHeight: '1.5' }],                                                // 13px
        'btn': ['0.84375rem', { lineHeight: '1', letterSpacing: '0.01em', fontWeight: '800' }],      // 13.5px
        'title': ['0.96875rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],                   // 15.5px
        'price': ['1rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '800' }],      // 16px
        'display': ['1.6875rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '900' }],// 27px
      },

      borderRadius: {
        sm: '4px',   // chips, badges, segmented controls
        DEFAULT: '6px', // buttons, inputs, icon buttons
        lg: '10px',  // cards, empty states
      },

      borderWidth: {
        // 1.5px is the system's border weight. Not 1, not 2.
        DEFAULT: '1.5px',
        hairline: '1px',
      },

      boxShadow: {
        // NOTHING BLURS. No shadow in this system has a blur radius — that is the
        // whole idea, and it is what makes everything else able to stay quiet.
        hard: '2px 2px 0 rgb(var(--ink))',
        'hard-lg': '3px 3px 0 rgb(var(--ink))',
        card: '0 2px 0 rgb(var(--border-strong))',
        none: 'none',
      },

      transitionTimingFunction: {
        press: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
      },
      transitionDuration: {
        press: '90ms',
      },

      minHeight: {
        // WCAG 2.2 target size. Icon buttons may LOOK 36px, but the tap target
        // must be padded out to this.
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
    },
  },
  plugins: [],
} satisfies Config;
