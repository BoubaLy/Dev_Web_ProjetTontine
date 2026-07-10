/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design system « Opal Soft Utility » (hex affinés — landing <-> app)
        bg: { DEFAULT: '#F6F8F7', deep: '#0F1E1C' },
        surface: '#FFFFFF',
        'surface-alt': '#EAF0EF',
        primary: { DEFAULT: '#2B6E64', strong: '#194B44', soft: '#DCE8E6' },
        accent: { DEFAULT: '#8DA9C4', soft: '#E6ECF4' },
        gold: { DEFAULT: '#C6974F', soft: '#F4EBD9' },
        success: { DEFAULT: '#4C9A6A', soft: '#E0EFE6' },
        danger: { DEFAULT: '#B8604B', soft: '#F3E2DC' },
        // ink-faint darkeni de #8A9997 -> #647570 pour passer le contraste AA (4.5:1) sur bg
        // clair, tout en restant visiblement plus doux que ink-soft (hiérarchie préservée).
        ink: { DEFAULT: '#152322', soft: '#54655F', faint: '#647570', inverse: '#F2F6F4' },
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
        glow: '0 0 32px rgba(43, 110, 100, 0.24)',
        'glow-gold': '0 0 32px rgba(198, 151, 79, 0.28)',
      },
      backgroundImage: {
        hero: 'linear-gradient(135deg, #6FBEB4 0%, #47A197 45%, #33847C 100%)',
        night: 'linear-gradient(135deg, #3E938B 0%, #2F736C 100%)',
        shimmer: 'linear-gradient(135deg, #8DA9C4 0%, #2B6E64 50%, #C6974F 100%)',
        'aurora-overlay': 'radial-gradient(ellipse 80% 60% at 50% 0%, transparent 30%, rgba(246,248,247,0.7) 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin': 'spin 1s linear infinite',
        'spin-slow': 'spin 9s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        // Token easing.standard reproduit en CSS
        'standard': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce': 'cubic-bezier(0.68, -0.4, 0.32, 1.4)',
        'gentle': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
