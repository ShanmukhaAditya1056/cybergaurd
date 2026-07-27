/** @type {import('tailwindcss').Config} */
// Zomato-inspired light theme. Token NAMES are kept (navy/blue/text/safe/...)
// so existing components restyle automatically; only the VALUES changed.
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces (was dark navy -> now light/white)
        navy: {
          DEFAULT: '#F4F4F2',   // app background
          bg: '#F4F4F2',
          card: '#FFFFFF',      // cards / panels
          border: '#E6E6E6',    // hairline borders
          light: '#FAFAFA'      // subtle raised surface
        },
        // Primary brand accent (Zomato red)
        blue: {
          accent: '#E23744',
          400: '#EF5664',
          600: '#C72C3B',
          700: '#B0212F'
        },
        // Text (was light-on-dark -> now dark-on-light)
        text: {
          white: '#1C1C1C',     // primary text
          muted: '#5C5C5C',     // secondary text
          dim: '#9A9A9A'        // tertiary / captions
        },
        safe: {
          DEFAULT: '#1FA463',
          bg: '#E7F6EE'
        },
        warn: {
          DEFAULT: '#E8932B',
          bg: '#FCF3E4'
        },
        danger: {
          DEFAULT: '#E23744',
          bg: '#FCEAEC'
        },
        critical: {
          DEFAULT: '#B0212F',
          bg: '#F9DDE0'
        }
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(28,28,28,0.10), 0 2px 6px rgba(28,28,28,0.06)',
        brand: '0 8px 20px -6px rgba(226,55,68,0.45)'
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
          '0%': { boxShadow: '0 0 5px rgba(226, 55, 68, 0.25)' },
          '100%': { boxShadow: '0 0 20px rgba(226, 55, 68, 0.45)' }
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
