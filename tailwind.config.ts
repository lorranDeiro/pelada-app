import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // PALETA PREMIUM - Inspirada em Sofascore/Betclic
        // ============================================
        
        // Fundos - Tons escuros/chumbo elegantes
        background: {
          DEFAULT: '#0f172a', // Azul escuro profundo
          secondary: '#1a2335', // Cinza azulado
          tertiary: '#232f42', // Mais claro para surface
          muted: '#0d1117',    // Muito escuro para componentes
        },
        
        // Accents - Vibrantes e desportivos
        accent: {
          DEFAULT: '#22c55e', // Verde energia (principal)
          bright: '#4ade80',  // Verde luminoso
          dark: '#16a34a',    // Verde escuro
          secondary: '#0ea5e9', // Azul elétrico
          warning: '#f59e0b', // Âmbar para alertas
          danger: '#ef4444',  // Vermelho para crítico
        },
        
        // Grays/Neutros sofisticados
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
        
        // Superfícies para Cards e componentes
        surface: {
          DEFAULT: '#1a2335',
          hover: '#232f42',
          active: '#2d3f55',
          border: '#3a4a62',
        },
        
        // Text colors
        text: {
          primary: '#e2e8f0',   // Light gray para texto principal
          secondary: '#94a3b8', // Medium gray para texto secundário
          muted: '#64748b',     // Muted gray
          accent: '#22c55e',    // Verde para destaques
        },
      },
      
      // Gradientes customizados
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, #0f172a 0%, #1a2335 100%)',
        'gradient-accent': 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)',
        'gradient-dark-overlay': 'linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.95) 100%)',
      },
      
      // Shadows elegantes
      boxShadow: {
        'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        'premium-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        'accent': '0 10px 15px -3px rgba(34, 197, 94, 0.2)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.15)',
      },
      
      // Borders sofisticados
      borderColor: {
        DEFAULT: '#3a4a62',
        muted: '#2d3f55',
        accent: '#22c55e',
      },
      
      // Animation elegante
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-accent': 'pulseAccent 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
      },
    },
  },
  plugins: [],
};

export default config;
