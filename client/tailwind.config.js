/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2E',
          bg: '#0D1B2E',
          card: '#102540',
          border: '#1A3C5E',
          light: '#152D4A'
        },
        blue: {
          accent: '#2E75B6',
          600: '#2563A0',
          700: '#1D4F80'
        },
        text: {
          white: '#E8F0FA',
          muted: '#8BA4C2',
          dim: '#4A7AA8'
        },
        safe: {
          DEFAULT: '#4CAF82',
          bg: '#0F2E1A'
        },
        warn: {
          DEFAULT: '#F0A030',
          bg: '#2E1F05'
        },
        danger: {
          DEFAULT: '#E05555',
          bg: '#2E0A0A'
        },
        critical: {
          DEFAULT: '#FF6B6B',
          bg: '#3E0808'
        }
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'score-fill': 'scoreFill 1.5s ease-out forwards'
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(46, 117, 182, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(46, 117, 182, 0.6)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        scoreFill: {
          '0%': { strokeDashoffset: '440' },
          '100%': { strokeDashoffset: 'var(--score-offset)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
