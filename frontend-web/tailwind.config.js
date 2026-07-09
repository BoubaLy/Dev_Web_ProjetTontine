/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design system « Opal Soft Utility » (hex affinés — landing ↔ app)
        bg: { DEFAULT: '#F6F8F7', deep: '#0F1E1C' },
        surface: '#FFFFFF',
        'surface-alt': '#EAF0EF',
        primary: { DEFAULT: '#2B6E64', strong: '#194B44', soft: '#DCE8E6' },
        accent: { DEFAULT: '#8DA9C4', soft: '#E6ECF4' },
        gold: { DEFAULT: '#C6974F', soft: '#F4EBD9' },
        success: { DEFAULT: '#4C9A6A', soft: '#E0EFE6' },
        danger: { DEFAULT: '#B8604B', soft: '#F3E2DC' },
        ink: { DEFAULT: '#152322', soft: '#54655F', faint: '#8A9997', inverse: '#F2F6F4' },
        line: '#DEE7E4',
      },
      fontFamily: {
        // App = Inter (sans/mono). Vitrine = Plus Jakarta Sans pour les titres (font-display).
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '12px', pill: '999px', sheet: '20px' },
      boxShadow: {
        soft: '0 4px 24px rgba(43, 110, 100, 0.08)',
        raised: '0 8px 32px rgba(43, 110, 100, 0.12)',
        lift: '0 18px 60px rgba(15, 30, 28, 0.14)',
      },
      backgroundImage: {
        hero: 'linear-gradient(135deg, #6FBEB4 0%, #47A197 45%, #33847C 100%)',
        night: 'linear-gradient(135deg, #3E938B 0%, #2F736C 100%)',
        shimmer: 'linear-gradient(135deg, #8DA9C4 0%, #2B6E64 50%, #C6974F 100%)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
