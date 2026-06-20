import { TOOLS } from '@/data/toolsData';
import { CERT_DATABASE } from '@/data/certEngine';
import { TOP_CERTS_DATABASE } from '@/data/topCerts';

// Static pages
const PAGES = [
  { id: 'page-home', path: '/', label: 'Home', tag: 'PAGE', desc: 'CertifyROI Landing Page' },
  { id: 'page-tools', path: '/tools', label: 'Tools Hub', tag: 'PAGE', desc: 'Browse all career navigation tools' },
  { id: 'page-blog', path: '/blog', label: 'Blog', tag: 'PAGE', desc: 'Read the latest articles and career advice' },
  { id: 'page-faq', path: '/faq', label: 'FAQ', tag: 'PAGE', desc: 'Frequently asked questions' },
];

/**
 * Perform a fast client-side search across tools, certs, and pages.
 * @param {string} query 
 * @returns {Array} search results mapped to { id, label, path, tag, desc, icon }
 */
export function performGlobalSearch(query) {
  if (!query || query.trim().length < 2) return [];

  const lowerQuery = query.toLowerCase().trim();
  const results = [];

  // 1. Search Tools
  TOOLS.forEach(tool => {
    if (
      tool.label.toLowerCase().includes(lowerQuery) ||
      tool.desc.toLowerCase().includes(lowerQuery) ||
      tool.tag.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        id: `tool-${tool.id}`,
        label: tool.label,
        path: tool.path,
        tag: 'TOOL',
        desc: tool.desc,
        icon: tool.icon // React component
      });
    }
  });

  // 2. Search Pages
  PAGES.forEach(page => {
    if (
      page.label.toLowerCase().includes(lowerQuery) ||
      page.desc.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        ...page,
        icon: null
      });
    }
  });

  // 3. Search Certifications from Databases
  // Flatten CERT_DATABASE
  Object.values(CERT_DATABASE).flat().forEach(cert => {
    if (
      cert.name.toLowerCase().includes(lowerQuery) ||
      cert.issuer.toLowerCase().includes(lowerQuery) ||
      (cert.whyItMatters && cert.whyItMatters.toLowerCase().includes(lowerQuery))
    ) {
      results.push({
        id: `cert-db-${cert.id}`,
        path: `/tools/cert-radar?search=${encodeURIComponent(cert.id)}`,
        label: cert.name,
        tag: 'CERT',
        desc: cert.issuer,
        icon: null
      });
    }
  });

  // Flatten TOP_CERTS_DATABASE
  Object.values(TOP_CERTS_DATABASE).flat().forEach(cert => {
    // Avoid duplicates if same cert exists in both
    if (results.some(r => r.label === cert.name)) return;
    
    if (
      cert.name.toLowerCase().includes(lowerQuery) ||
      cert.issuer.toLowerCase().includes(lowerQuery) ||
      (cert.whyItMatters && cert.whyItMatters.toLowerCase().includes(lowerQuery))
    ) {
      results.push({
        id: `cert-top-${cert.id}`,
        path: `/tools/cert-radar?search=${encodeURIComponent(cert.id)}`,
        label: cert.name,
        tag: 'CERT',
        desc: cert.issuer,
        icon: null
      });
    }
  });

  return results;
}
