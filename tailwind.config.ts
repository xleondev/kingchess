import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        board: {
          light: '#f0d9b5',
          dark: '#b58863',
          highlight: '#f6f669',
          legal: 'rgba(0,0,0,0.15)',
          check: 'rgba(220,38,38,0.6)',
        },
        brand: {
          green: '#1a6b3c',
          gold: '#d4a017',
          cream: '#fdf6e3',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
