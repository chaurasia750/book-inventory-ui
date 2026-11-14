/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './apps/*/src/**/*.{html,ts,scss}',
    './libs/**/*.{html,ts,scss}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '475px',
      },
      colors: {
        // ── HAUT INFRA palette ────────────────────────────────────────────
        // Flat aliases for the seven brand colours, for direct use in
        // templates (e.g. `bg-deep-charcoal`, `text-warm-white`).
        'deep-charcoal': '#171717',
        graphite: '#242424',
        'premium-gold': '#C9A227',
        'highlight-gold': '#E3C15A',
        'warm-white': '#F5F3EE',
        'muted-gray': '#B8B8B8',
        ivory: '#F7F5F0',

        // `gold` is the canonical accent ramp. `saffron` and `brand` are kept
        // as aliases because most existing templates still use those names.
        gold: {
          50: '#FBF8EF',
          100: '#F5EED6',
          200: '#EBDDAA',
          300: '#DCC87A',
          400: '#E3C15A',
          500: '#C9A227',
          600: '#8F7211',
          700: '#6E5809',
          800: '#43330A',
          900: '#241C05',
        },
        // `charcoal` is the canonical neutral ramp. `brown` is kept as an
        // alias because it is what the public header/footer still use for
        // their dark surfaces.
        charcoal: {          50: '#F7F5F0',
          100: '#E8E5DD',
          200: '#D3CEC2',
          300: '#B8B8B8',
          400: '#8C8A83',
          500: '#5A5952',
          600: '#3A3934',
          700: '#2A2926',
          800: '#242424',
          900: '#171717',
        },
        // Aliases — same values, legacy names.
        saffron: {
          50: '#FBF8EF',
          100: '#F5EED6',
          200: '#EBDDAA',
          300: '#DCC87A',
          400: '#E3C15A',
          500: '#C9A227',
          600: '#8F7211',
          700: '#6E5809',
          800: '#43330A',
          900: '#241C05',
        },
        brand: {
          50: '#FBF8EF',
          100: '#F5EED6',
          200: '#EBDDAA',
          300: '#DCC87A',
          400: '#E3C15A',
          500: '#C9A227',
          600: '#8F7211',
          700: '#6E5809',
          800: '#43330A',
          900: '#241C05',
        },
        brown: {
          50: '#F7F5F0',
          100: '#E8E5DD',
          200: '#D3CEC2',
          300: '#B8B8B8',
          400: '#8C8A83',
          500: '#5A5952',
          600: '#3A3934',
          700: '#2A2926',
          800: '#242424',
          900: '#171717',
        },
        // Secondary accent — used for informational/highlight surfaces only.
        copper: {
          50: '#FDF4EC',
          100: '#FAE5D3',
          200: '#F4C9A6',
          300: '#EBA871',
          400: '#E08A45',
          500: '#D4712C',
          600: '#B45A1E',
          700: '#8E4417',
          800: '#5E2D11',
          900: '#33190A',
        },
      },
      fontFamily: {
        heading: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
        body: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      // Public-site design system (realty.md PD1): two elevation levels and the fixed header height.
      boxShadow: {
        card: '0 1px 2px rgba(23, 23, 23, 0.04), 0 8px 24px -12px rgba(23, 23, 23, 0.18)',
        lift: '0 2px 4px rgba(23, 23, 23, 0.06), 0 18px 40px -16px rgba(23, 23, 23, 0.28)',
      },
      spacing: {
        header: '4rem',
        'header-lg': '4.75rem',
      },
    },
  },
  plugins: [],
};
