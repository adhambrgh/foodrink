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
        primary: '#F26B1D',
        'primary-dark': '#A14000',
        'primary-light': '#FFDBCC',
        success: '#1F7A4D',
        'success-light': '#9BF2BB',
        surface: '#FAF8F5',
        'surface-card': '#FFFFFF',
        'surface-low': '#FAF2EE',
        'surface-mid': '#F4ECE8',
        'surface-variant': '#E9E1DD',
        text: '#1C1917',
        'text-muted': '#594237',
        outline: '#8C7166',
        error: '#BA1A1A',
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
        display: ['var(--font-display)', 'system-ui', 'serif'],
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