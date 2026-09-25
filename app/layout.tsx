import type { Metadata } from 'next'
import Script from 'next/script'
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
      <head>
        <Script
          strategy="beforeInteractive"
          id="strip-extension-attrs"
          dangerouslySetInnerHTML={{
            __html: `(function(){var KNOWN=['bis_skin_checked'];function strip(){if(!document.body)return;var els=document.body.querySelectorAll('*');for(var i=0;i<els.length;i++){var el=els[i];for(var j=0;j<KNOWN.length;j++){if(el.hasAttribute(KNOWN[j]))el.removeAttribute(KNOWN[j])}}}function go(){var n=10;var iv=setInterval(function(){strip();if(--n<=0)clearInterval(iv)},100)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()})()`,
          }}
        />
      </head>
      <body
        className={`${head.variable} ${body.variable} ${serif.variable} ${mono.variable}`}
      >
        {children}
      </body>
    </html>
  )
}