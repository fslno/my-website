import { MetadataRoute } from 'next';
import { LIVE_DOMAIN } from '@/lib/deployment';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/checkout/success/', '/account/'],
    },
    sitemap: `https://${LIVE_DOMAIN}/sitemap.xml`,
  };
}
