import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://rizzup.antideploy.com/sitemap.xml',
    host: 'https://rizzup.antideploy.com',
  }
}