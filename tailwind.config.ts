import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf6ee',
          100: '#f9e8d0',
          200: '#f3cd9d',
          300: '#ecac65',
          400: '#e58b3a',
          500: '#dc6f1d',
          600: '#c35514',
          700: '#a23d13',
          800: '#833217',
          900: '#6b2c16',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#cddcce',
          300: '#a8c2aa',
          400: '#7da180',
          500: '#5a8360',
          600: '#456749',
          700: '#38523c',
          800: '#2e4231',
          900: '#263729',
        }
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
