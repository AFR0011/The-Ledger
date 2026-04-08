import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        panel:
          '0 0 0 1px rgba(255,255,255,0.04), 0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.02)',
        focus: '0 0 0 1px rgba(113,112,255,0.4), 0 0 0 4px rgba(113,112,255,0.12)'
      },
      fontFamily: {
        sans: ['Inter', '"Inter Variable"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        mono: ['"Berkeley Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
