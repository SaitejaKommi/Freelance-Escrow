/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        bg: {
          base:     '#0e0c0a',
          surface:  '#141210',
          elevated: '#1c1917',
          overlay:  '#242018',
        },
        border: {
          DEFAULT: '#2e2b26',
          subtle:  '#201e1b',
          focus:   '#DA7756',
        },
        text: {
          primary:   '#F5ECD7',
          secondary: '#9a8f82',
          muted:     '#5a5248',
          code:      '#e8d5b8',
        },
        cl: {
          orange:  '#DA7756',
          orange2: '#E8896A',
          rust:    '#A0522D',
          cream:   '#F5ECD7',
          sand:    '#C8B89A',
        },
        dev: {
          green:  '#4ade80',
          cyan:   '#67e8f9',
          purple: '#c084fc',
          amber:  '#fbbf24',
          red:    '#f87171',
        },
      },
      animation: {
        'blink':       'blink 1.1s step-end infinite',
        'pulse-glow':  'pulse-glow 2.5s ease-in-out infinite',
        'slide-up':    'slide-up 0.2s ease-out',
        'shimmer':     'shimmer 1.6s infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        blink:       { '50%': { opacity: '0' } },
        'pulse-glow':{ '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(0.75)' } },
        'slide-up':  { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer:     { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
};
