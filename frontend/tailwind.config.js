/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        haunted: {
          dark: '#0a0a0f',
          darker: '#050508',
          purple: '#6b21a8',
          'purple-light': '#a855f7',
          green: '#10b981',
          'green-dark': '#047857',
          red: '#dc2626',
          'red-dark': '#991b1b',
          orange: '#f97316',
          gray: '#1f2937',
          'gray-light': '#374151',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};
