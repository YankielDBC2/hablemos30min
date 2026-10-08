import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/terminos', '/privacidad'].map(path => ({ url: new URL(path, SITE_URL).toString(), changeFrequency: path === '/' ? 'weekly' : 'monthly', priority: path === '/' ? 1 : 0.4 }));
}
