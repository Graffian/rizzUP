import type { Metadata } from 'next'
import {
  Bricolage_Grotesque,
  Instrument_Serif,
  Schibsted_Grotesk,
  Space_Mono,
} from 'next/font/google'
import './globals.css'

const head = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-head',
  weight: ['700'],
})
const body = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
})
const serif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
})
const mono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'RizzUp — reply like you mean it',
  description:
    'Paste the message. Get a handful of smooth, specific replies — no pickup lines, no cringe.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-ink">
      <body
        className={`${head.variable} ${body.variable} ${serif.variable} ${mono.variable}`}
      >
        {children}
      </body>
    </html>
  )
}