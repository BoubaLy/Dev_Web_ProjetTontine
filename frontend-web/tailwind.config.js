/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design system « Opal Soft Utility »
        bg: '#F5F7F7',
        surface: '#FFFFFF',
        'surface-alt': '#EAF0EF',
        primary: { DEFAULT: '#2F6F6A', strong: '#1E4E4A', soft: '#DCE8E6' },
        accent: { DEFAULT: '#8FA6C9', soft: '#E6ECF4' },
        gold: { DEFAULT: '#C99A4B', soft: '#F4EBD9' },
        success: { DEFAULT: '#4C9A6A', soft: '#E0EFE6' },
        danger: { DEFAULT: '#B8604B', soft: '#F3E2DC' },
        ink: { DEFAULT: '#1E2B2A', soft: '#5B6D6B', faint: '#8A9997' },
        line: '#E1E8E7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '12px', pill: '999px', sheet: '20px' },
      boxShadow: {
        soft: '0 4px 24px rgba(47, 111, 106, 0.08)',
        raised: '0 8px 32px rgba(47, 111, 106, 0.12)',
      },
      backgroundImage: {
        hero: 'linear-gradient(135deg, #6FBEB4 0%, #47A197 45%, #33847C 100%)',
        night: 'linear-gradient(135deg, #3E938B 0%, #2F736C 100%)',
      },
    },
  },
  plugins: [],
};
