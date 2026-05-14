import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // PALETA PREMIUM - Inspirada em Sofascore/Betclic
        // Brand tokens via CSS vars (light + dark mode swap)
        // ============================================

        background: {
          DEFAULT: 'var(--brand-bg)',
          secondary: 'var(--brand-bg-secondary)',
          tertiary: 'var(--brand-bg-tertiary)',
          muted: 'var(--brand-bg-muted)',
        },

        // Accents — vibrantes, iguais em ambos os modos
        accent: {
          DEFAULT: '#22c55e',
          bright: '#4ade80',
          dark: '#16a34a',
          secondary: '#0ea5e9',
          warning: '#f59e0b',
          danger: '#ef4444',
        },

        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },

        surface: {
          DEFAULT: 'var(--brand-surface)',
          hover: 'var(--brand-surface-hover)',
          active: 'var(--brand-surface-active)',
          border: 'var(--brand-surface-border)',
        },

        text: {
          primary: 'var(--brand-text-primary)',
          secondary: 'var(--brand-text-secondary)',
          muted: 'var(--brand-text-muted)',
          accent: '#22c55e',
        },
      },

      // Gradientes customizados (gradient-premium acompanha o tema)
      backgroundImage: {
        'gradient-premium': 'var(--brand-gradient-premium)',
        'gradient-accent': 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)',
        'gradient-dark-overlay': 'var(--brand-gradient-dark-overlay)',
      },
      
      // Shadows elegantes
      boxShadow: {
        'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        'premium-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        'accent': '0 10px 15px -3px rgba(34, 197, 94, 0.2)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.15)',
      },
      
      // Borders sofisticados (DEFAULT acompanha o tema)
      borderColor: {
        DEFAULT: 'var(--brand-surface-border)',
        muted: 'var(--brand-surface-active)',
        accent: '#22c55e',
      },
      
      // Animation elegante
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-accent': 'pulseAccent 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseAccent: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': {
            transform: 'translateX(-100%) rotate(12deg)',
            opacity: '0.1',
          },
          '50%': {
            opacity: '0.25',
          },
          '100%': {
            transform: 'translateX(100%) rotate(12deg)',
            opacity: '0.1',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
