export const COLORS = {
  bgBase: '#0B0F19',
  bgSurface: '#111827',
  bgElevated: '#1F2937',
  accent: '#F97316',
  gold: '#F97316',
  danger: '#F85149',
  success: '#22C55E',
  textPrimary: '#F8FAFC',
  textMuted: '#94A3B8',
  border: 'rgba(255,255,255,0.08)',
};

export const STATUS_STYLES: Record<string, { label: string; className: string; dot?: string }> = {
  pending: { label: 'pending', className: 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30 font-mono font-medium' },
  approved: { label: 'approved', className: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-mono font-medium' },
  rejected: { label: 'rejected', className: 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30 font-mono font-medium' },
  flagged: { label: 'flagged', className: 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30 font-mono font-medium' },
  staging: { label: 'staging', className: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-mono font-medium' },
  live: { label: 'live', className: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-mono font-medium', dot: 'bg-[#22C55E] animate-pulse' },
  New: { label: 'New', className: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-mono font-medium' },
  Contacted: { label: 'Contacted', className: 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30 font-mono font-medium' },
  'In Discussion': { label: 'In Discussion', className: 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30 font-mono font-medium' },
  Converted: { label: 'Converted', className: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-mono font-medium' },
  'Not Interested': { label: 'Not Interested', className: 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30 font-mono font-medium' },
};

export const NAVIGATION_GROUPS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: 'LayoutDashboard', restricted: false },
      { name: 'Analytics', href: '/analytics', icon: 'BarChart2', restricted: false },
    ],
  },
  {
    title: 'Submissions',
    items: [
      { name: 'Resume Uploads', href: '/submissions/resumes', icon: 'FileText', restricted: false },
      { name: 'Offer Letters', href: '/submissions/offers', icon: 'Briefcase', restricted: false },
    ],
  },
  {
    title: 'Data Management',
    items: [
      { name: 'Certifications', href: '/data/certifications', icon: 'Award', restricted: false, publishRestricted: true },
      { name: 'Market Jobs', href: '/data/jobs', icon: 'Database', restricted: false, publishRestricted: true },
    ],
  },
  {
    title: 'Content',
    items: [
      { name: 'User Feedback', href: '/content/feedback', icon: 'MessageSquare', restricted: false },
      { name: 'Contact Messages', href: '/content/contacts', icon: 'Mail', restricted: false },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Feature Flags', href: '/system/flags', icon: 'ToggleRight', restricted: true, superAdminOnly: true },
      { name: 'Audit Log', href: '/system/audit', icon: 'ShieldCheck', restricted: true, superAdminOnly: true },
      { name: 'Settings', href: '/system/settings', icon: 'Settings', restricted: true, superAdminOnly: true },
    ],
  },
];

export const EMAIL_TEMPLATES = [
  {
    title: 'Pilot Program Response',
    subject: 'Re: Pilot Program for Batch Certification Analysis',
    body: `Hi there,\n\nThanks for reaching out about running a pilot program with Certifyd. We would love to collaborate with your placement cell and provide our ROI tools for your students.\n\nCould we schedule a quick 15-minute call this week to align on the batch size and timeline?\n\nBest regards,\nCertifyd Operations Team`,
  },
  {
    title: 'Partnership Opportunity',
    subject: 'Re: Partnership Inquiry with Certifyd',
    body: `Hi there,\n\nThank you for reaching out! We are excited about potential synergy and would love to explore a partnership.\n\nPlease share your availability for an introductory discussion next week.\n\nBest regards,\nCertifyd Operations Team`,
  },
  {
    title: 'Investor Follow-up',
    subject: 'Re: Investor Inquiry - Certifyd Platform Metrics',
    body: `Hi there,\n\nThank you for your interest in Certifyd. We are seeing strong organic growth across tech professionals using our AI calculation engine.\n\nI have attached our latest high-level traction summary. Let me know when you would be open for a chat.\n\nBest regards,\nCertifyd Operations Team`,
  },
];
