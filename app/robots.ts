import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/claver/', '/claver/apps/'],
      disallow: ['/api/', '/dashboard/', '/claver-cloud/', '/claver-cliente/'],
    },
    sitemap: 'https://claver.app/sitemap.xml',
  }
}
