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
        ink: '#101827',
        ink2: '#172236',
        panel: '#1a2940',
        panel2: '#22334d',
        line: '#2b3b54',
        line2: '#40536e',
        paper: '#f7f4ec',
        muted: '#a7b3c4',
        faint: '#74839a',
        rust: '#ff8b6b',
        gold: '#f3c969',
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
