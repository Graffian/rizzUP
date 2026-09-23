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
        ink: '#f3eee6',
        ink2: '#ebe4d9',
        panel: '#fffdf8',
        panel2: '#f7f1e8',
        line: '#e2d9cd',
        line2: '#cfc2b2',
        paper: '#202a31',
        muted: '#657078',
        faint: '#9a958c',
        rust: '#ee6d52',
        gold: '#dcae3f',
      },
      fontFamily: {
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        head: ['var(--font-head)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serifit: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
