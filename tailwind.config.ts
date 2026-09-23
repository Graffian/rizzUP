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
        ink: '#0b0a09',
        ink2: '#111009',
        panel: '#141210',
        panel2: '#1a1714',
        line: '#27241c',
        line2: '#3a352b',
        paper: '#f4f1ea',
        muted: '#8a857a',
        faint: '#5c584f',
        rust: '#ff5a36',
        gold: '#ffb454',
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