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
  metadataBase: new URL('https://rizzup.antideploy.com'),
  title: {
    default: 'RizzUp — AI Flirty Reply Generator',
    template: '%s · RizzUp',
  },
  description:
    'Paste any message or a screenshot of the conversation. RizzUp writes the one reply worth sending — smooth, specific, zero pickup lines, zero cringe.',
  applicationName: 'RizzUp',
  authors: [{ name: 'RizzUp' }],
  creator: 'RizzUp',
  publisher: 'RizzUp',
  category: 'AI writing assistant',
  keywords: [
    'rizzup',
    'flirty reply generator',
    'what to text a girl',
    'rizz text generator',
    'how to reply on instagram',
    'reply ideas for dm',
    'pickup lines',
    'texting ideas',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: 'https://rizzup.antideploy.com',
  },
  icons: {
    icon: '/rizzup-wordmark-256h.png',
    apple: '/rizzup-wordmark-512h.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://rizzup.antideploy.com',
    siteName: 'RizzUp',
    title: 'RizzUp — AI Flirty Reply Generator',
    description:
      'Paste any message or a screenshot of the conversation. RizzUp writes the one reply worth sending — smooth, specific, zero pickup lines, zero cringe.',
    locale: 'en_US',
    images: [
      {
        url: 'https://rizzup.antideploy.com/rizzup-wordmark-512h.png',
        width: 512,
        height: 512,
        alt: 'RizzUp',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'RizzUp — AI Flirty Reply Generator',
    description:
      'Paste any message or a screenshot of the conversation. RizzUp writes the one reply worth sending — smooth, specific, zero pickup lines, zero cringe.',
    images: ['https://rizzup.antideploy.com/rizzup-wordmark-512h.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'RizzUp',
      url: 'https://rizzup.antideploy.com',
      description:
        'Paste any message or a screenshot of the conversation. RizzUp writes the one reply worth sending.',
      inLanguage: 'en',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RizzUp',
      url: 'https://rizzup.antideploy.com',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '15',
        priceCurrency: 'USD',
      },
      description:
        'AI reply generator — paste a message or screenshot and get the one flirty reply worth sending.',
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}