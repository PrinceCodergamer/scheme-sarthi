const svgToDataUri = require("mini-svg-data-uri")
const flattenColorPalette =
  require("tailwindcss/lib/util/flattenColorPalette").default

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#174f3b',
        'primary-dark': '#0f3a2b',
        'primary-light': '#e4f1e8',
        'primary-50': '#f0f8f3',
        gold: '#e7bd58',
        'gold-light': '#fff0cf',
        green: '#207348',
        'green-light': '#dff3e5',
        danger: '#b3422f',
        'danger-light': '#fde4df',
        warning: '#a35b0c',
        'warning-light': '#fff0cf',
        blue: '#21619d',
        'blue-bg': '#dfebfb',
        violet: '#69458c',
        'violet-bg': '#ede5f6',
        surface: '#ffffff',
        background: '#eef2ef',
        'phone-bg': '#f8faf8',
        'text-primary': '#17372a',
        'text-secondary': '#6b8375',
        'text-muted': '#74857b',
        neutral: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E2E6EA',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#868E96',
          600: '#5A6072',
          700: '#343A40',
          800: '#1A1D29',
          900: '#0D0F15',
        },
      },
      fontFamily: {
        sans: ['Hind', 'Noto Sans Devanagari', 'Noto Sans', 'system-ui', 'sans-serif'],
        heading: ['Hind', 'Noto Sans Devanagari', 'Noto Sans', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.9375rem', { lineHeight: '1.5rem' }],
        'lg': ['1.0625rem', { lineHeight: '1.625rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '14px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 12px 25px rgba(22,67,46,0.09)',
        'card-back': '0 14px 30px rgba(22,67,46,0.2)',
        'card-hover': '0 4px 12px rgba(23,79,59,0.1)',
        'card-lg': '0 4px 16px rgba(23,79,59,0.08)',
        'phone': '0 0 40px rgba(0,0,0,0.1)',
        'glow': '0 0 20px rgba(23,79,59,0.15)',
        'glow-lg': '0 0 40px rgba(23,79,59,0.2)',
        'gold': '0 12px 24px rgba(113,81,15,0.25)',
      },
      maxWidth: {
        'mobile': '480px',
      },
      animation: {
        'scan': 'scan 2.5s ease-in-out infinite',
        'slide-left': 'slide-left 0.3s ease-out',
        'slide-right': 'slide-right 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'count-up': 'count-up 1.5s ease-out',
        'pulse-dot': 'pulse-dot 2s infinite',
        'gradient': 'gradient 8s linear infinite',
        'marquee': 'marquee var(--duration) infinite linear',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
        'shine': 'shine var(--duration) infinite linear',
        'blink-cursor': 'blink-cursor 1.2s step-end infinite',
        'spotlight': 'spotlight 2s ease 0.75s 1 forwards',
      },
      keyframes: {
        'scan': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { transform: 'translateY(0%)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3)' },
        },
        'gradient': {
          'to': { backgroundPosition: 'var(--bg-size, 300%) 0' },
        },
        'marquee': {
          'from': { transform: 'translateX(0)' },
          'to': { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'marquee-vertical': {
          'from': { transform: 'translateY(0)' },
          'to': { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
        'shine': {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          'to': { backgroundPosition: '0% 0%' },
        },
        'blink-cursor': {
          '0%, 49%': { opacity: 1 },
          '50%, 100%': { opacity: 0 },
        },
        'spotlight': {
          '0%': { opacity: 0, transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: 1, transform: 'translate(-50%, -40%) scale(1)' },
        },
      },
    },
  },
  plugins: [
    addVariablesForColors,
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'bg-grid': (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          'bg-grid-small': (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          'bg-dot': (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
          }),
        },
        { values: flattenColorPalette(theme('backgroundColor')), type: 'color' }
      )
    },
  ],
}

function addVariablesForColors({ addBase, theme }) {
  const allColors = flattenColorPalette(theme('colors'))
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  )
  addBase({ ':root': newVars })
}
