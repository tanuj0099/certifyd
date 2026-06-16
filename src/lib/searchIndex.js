import { TOOLS } from '@/data/toolsData';
import { CERT_DATABASE } from '@/data/certEngine';
import { TOP_CERTS_DATABASE } from '@/data/topCerts';
import { GOVT_DATA, PRIVATE_DATA } from '@/data/jobCertData';

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

  // Extract all unique cert names from GOVT_DATA and PRIVATE_DATA
  const uniqueCerts = new Set();
  
  const extractCertsFromString = (certStr) => {
    if (!certStr) return;
    // split by common delimiters
    const parts = certStr.split(/[\/\+,]|( or )|( and )/).map(s => s?.trim()).filter(Boolean);
    parts.forEach(p => {
      const lowerP = p.toLowerCase();
      if (
        p.length > 3 && 
        !lowerP.includes('no specific') && 
        !lowerP.includes('no mandatory') &&
        !lowerP.includes('depending on') &&
        !lowerP.includes('performance-based') &&
        !lowerP.includes('preferred') &&
        !lowerP.includes('required')
      ) {
        // Clean up some text
        let cleanName = p.replace(/\(.*\)/, '').trim(); // Remove parentheticals
        if (cleanName.length > 2) {
          uniqueCerts.add(cleanName);
        }
      }
    });
  };

  GOVT_DATA.forEach(org => {
    org.roles.forEach(role => {
      extractCertsFromString(role.cert);
    });
  });

  PRIVATE_DATA.forEach(company => {
    company.tracks.forEach(track => {
      if (Array.isArray(track.certs)) {
        track.certs.forEach(extractCertsFromString);
      } else {
        extractCertsFromString(track.certs);
      }
    });
  });

  // Search the extracted unique certs
  Array.from(uniqueCerts).forEach(certName => {
    if (certName.toLowerCase().includes(lowerQuery)) {
      // Avoid duplicates from CERT_DATABASE or TOP_CERTS_DATABASE
      if (!results.some(r => r.tag === 'CERT' && r.label.toLowerCase().includes(certName.toLowerCase()))) {
        results.push({
          id: `cert-extracted-${certName.replace(/\s+/g, '-')}`,
          path: `/tools/cert-radar?search=${encodeURIComponent(certName)}`,
          label: certName,
          tag: 'CERT',
          desc: 'Industry Certification',
          icon: null
        });
      }
    }
  });

  // 4. Search Job Roles
  GOVT_DATA.forEach(org => {
    org.roles.forEach(role => {
      if (
        role.role.toLowerCase().includes(lowerQuery) ||
        role.cert.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: `role-govt-${role.role}`,
          path: `/tools/jobmap?search=${encodeURIComponent(role.role)}`,
          label: role.role,
          tag: 'ROLE',
          desc: `${org.org} - Requires: ${role.cert}`,
          icon: null
        });
      }
    });
  });

  PRIVATE_DATA.forEach(company => {
    company.tracks.forEach(track => {
      if (
        track.to.toLowerCase().includes(lowerQuery) ||
        track.certs.some(c => c.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          id: `role-priv-${company.company}-${track.to}`,
          path: `/tools/jobmap?search=${encodeURIComponent(track.to)}`,
          label: `${company.company} ${track.to}`,
          tag: 'ROLE',
          desc: `Requires: ${track.certs.join(', ')}`,
          icon: null
        });
      }
    });
  });

  return results;
}
