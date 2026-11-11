/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#F9951A',
        'primary-dark': '#E5820A',
        'primary-soft': '#FFF4E3',
        success: '#1F7A4D',
        'success-light': '#9BF2BB',
        surface: '#FAF8F5',
        'surface-card': '#FFFFFF',
        'surface-low': '#FAF2EE',
        'surface-mid': '#F4ECE8',
        'surface-variant': '#E9E1DD',
        text: '#0F1F2E',
        'text-muted': '#7B8794',
        outline: '#E4E7EB',
        error: '#BA1A1A',
        field: '#F5F5F6',
        line: '#E4E7EB',
        receipt: {
          hero: 'linear-gradient(135deg, #F26B1D 0%, #EA580C 100%)',
          heroText: '#FFFFFF',
          success: '#1F7A4D',
          successBg: '#ECFDF5',
          pending: '#F26B1D',
          pendingBg: '#FFF7ED',
          failed: '#BA1A1A',
          failedBg: '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '0.75rem',
        'space-lg': '1rem',
        'space-xl': '1.5rem',
        'space-2xl': '2rem',
        'space-3xl': '3rem',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      screens: {
        'mobile': '390px',
      },
    },
  },
  plugins: [],
};