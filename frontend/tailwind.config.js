/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'var(--accent-yellow)',
          light: 'var(--accent-yellow-light)',
          faint: 'var(--accent-yellow-faint)',
          gold: 'var(--accent-gold)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        panel: 'var(--panel)',
        border: 'var(--border)',
        bg: '#050816',
        bg2: '#070B1A',
        bg3: '#0A1020',
        primary: '#2563EB',
        indigo: '#4F46E5',
        violet: '#7C3AED',
        purple: '#9333EA',
        sky: '#00C2FF',
        text: '#F8FAFC',
        muted: '#94A3B8',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(59,130,246,0.22), 0 10px 40px rgba(2,6,23,0.55), 0 0 50px rgba(59,130,246,0.18)',
        neon: 'var(--shadow)',
        card: '0 10px 24px rgba(15, 23, 42, 0.06)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at top, rgba(59,130,246,0.22), transparent 35%), radial-gradient(circle at 80% 0%, rgba(147,51,234,0.22), transparent 26%), radial-gradient(circle at 50% 100%, rgba(0,194,255,0.12), transparent 30%)',
        'panel': 'linear-gradient(180deg, rgba(15,23,42,0.82), rgba(7,11,26,0.92))',
        'glass': 'linear-gradient(180deg, rgba(15,23,42,0.72), rgba(7,11,26,0.54))',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      zIndex: {
        80: '80',
        85: '85',
        90: '90',
        92: '92',
        93: '93',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};
