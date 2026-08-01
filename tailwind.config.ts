import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0284C7', // sky-600
          light: '#38BDF8',   // sky-400
          wash: '#F0F9FF',    // sky-50
        },
        surface: {
          bg: '#F8FAFC',      // slate-50
          card: '#FFFFFF',    // white
          border: 'rgba(226, 232, 240, 0.8)', // slate-200/80
        },
        content: {
          primary: '#1E293B', // slate-800
          muted: '#64748B',   // slate-500
        },
        status: {
          success: '#10B981', // emerald-500
          warning: '#F59E0B', // amber-500
          danger: '#F43F5E',  // rose-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
