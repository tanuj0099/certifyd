import { CERTIFICATIONS } from '@/tokens.js';
import { ROADMAP_INDEX } from '@/data/roadmapIndex.js';
import slugify from '@/utils/slugify.js';

export default async function sitemap() {
  const baseUrl = 'https://certifyd.in';

  // Base routes
  const staticRoutes = [
    '',
    '/tools',
    '/tools/cert-radar',
    '/tools/college',
    '/tools/compare',
    '/tools/heatmap',
    '/tools/hike',
    '/tools/jobmap',
    '/tools/market',
    '/tools/resume',
    '/tools/roi',
    '/tools/simulator',
    '/offer-analysis',
    '/roadmaps',
    '/features',
    '/how-it-works',
    '/pricing',
    '/about',
    '/blog',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
    '/choose-path',
    '/login',
    '/signup'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : (route.startsWith('/tools/') ? 0.9 : 0.8),
  }));

  // Certification routes
  const certRoutes = CERTIFICATIONS.map((cert) => ({
    url: `${baseUrl}/cert/${slugify(cert.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Roadmap routes
  const roadmapRoutes = ROADMAP_INDEX.map((roadmap) => ({
    url: `${baseUrl}/roadmap/${roadmap.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...certRoutes, ...roadmapRoutes];
}
