/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    // Standard mobile-first breakpoints. The previous config redefined every
    // screen as `max-width`, inverting the meaning of every utility and leaving
    // screens wider than 1535px with no responsive rules at all.
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#FBFAF8',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#0B0B0C',
          900: '#0B0B0C',
          800: '#1C1B19',
          700: '#2E2C29',
          600: '#45423D',
          500: '#6B6862',
          400: '#8C8880',
          300: '#B3AEA5',
          200: '#D6D1C8',
          100: '#E8E4DD',
          50: '#F4F2EE',
        },
        gold: {
          DEFAULT: '#A67C3D',
          700: '#7A5A2B',
          600: '#8F6B33',
          500: '#A67C3D',
          400: '#BE9455',
          300: '#D4B27E',
          200: '#E6D2B0',
          100: '#F2E7D3',
          50: '#FAF5EB',
        },
        success: '#1F6F43',
        danger: '#9B2C2C',

        // Official platform colours. Social buttons must read as the platform
        // they open, not as generic grey chrome — that recognition is what makes
        // a one-tap contact row feel trustworthy rather than decorative.
        brand: {
          whatsapp: '#25D366',
          'whatsapp-dark': '#1DA851',
          facebook: '#1877F2',
          'facebook-dark': '#0C63D4',
          youtube: '#FF0000',
          'youtube-dark': '#CC0000',
          tiktok: '#010101',
          // Instagram has no single colour; it is a three-stop gradient.
          'instagram-from': '#F58529',
          'instagram-via': '#DD2A7B',
          'instagram-to': '#8134AF',
        },
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Layered, low-opacity shadows. A single hard shadow reads as "template".
        subtle: '0 1px 2px rgba(11,11,12,0.04), 0 1px 1px rgba(11,11,12,0.03)',
        card: '0 1px 2px rgba(11,11,12,0.04), 0 8px 24px -12px rgba(11,11,12,0.10)',
        lift: '0 2px 4px rgba(11,11,12,0.04), 0 16px 40px -16px rgba(11,11,12,0.16)',
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      maxWidth: {
        prose: '68ch',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
