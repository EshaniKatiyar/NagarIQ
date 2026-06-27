/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          50:  '#eef7ff',
          100: '#d8eeff',
          200: '#b9e0ff',
          300: '#89cbff',
          400: '#52adff',
          500: '#2a8aff',
          600: '#1066f5',
          700: '#0d50e1',
          800: '#1141b6',
          900: '#143a8f',
        },
        accent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        amber: {
          50:  '#fdf8ed',
          100: '#faedcf',
          200: '#f4d99c',
          300: '#edc068',
          400: '#e6a23c',
          500: '#d97f24',
          600: '#c0611a',
          700: '#9f4719',
          800: '#82391b',
          900: '#6c3019',
        },
        sand: {
          50:  '#faf7f1',
          100: '#f3ede1',
          200: '#e9ddc9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'trace': 'trace 4s cubic-bezier(0.4,0,0.2,1) infinite',
        'heartbeat': 'heartbeat 0.48s ease-in-out infinite',
        'ping-ring': 'pingRing 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        trace: { '0%': { strokeDashoffset: '2400' }, '55%': { strokeDashoffset: '0' }, '100%': { strokeDashoffset: '0' } },
        heartbeat: { '0%,100%': { transform: 'scale(1)' }, '20%': { transform: 'scale(1.3)' }, '40%': { transform: 'scale(1)' } },
        pingRing: { '0%': { transform: 'scale(0.9)', opacity: '0.5' }, '70%,100%': { transform: 'scale(1.6)', opacity: '0' } },
      }
    },
  },
  plugins: [],
}