import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
export default function robots(): MetadataRoute.Robots {
  // Crawlers need to see the noindex metadata on admin and confirmation pages.
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/'] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
