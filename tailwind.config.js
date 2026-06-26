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
        }
      },
    },
  },
  plugins: [],
}