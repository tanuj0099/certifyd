export const COLORS = {
  bgBase: '#080A0E',
  bgSurface: '#0F1218',
  bgElevated: '#161B22',
  accent: '#00D4A8',
  gold: '#E8C547',
  danger: '#F85149',
  success: '#22C55E',
  textPrimary: '#F0F6FC',
  textMuted: '#8B949E',
  border: 'rgba(255,255,255,0.06)',
};

export const STATUS_STYLES: Record<string, { label: string; className: string; dot?: string }> = {
  pending: { label: 'pending', className: 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30' },
  approved: { label: 'approved', className: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30' },
  rejected: { label: 'rejected', className: 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30' },
  flagged: { label: 'flagged', className: 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30' },
  staging: { label: 'staging', className: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30' },
  live: { label: 'live', className: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30', dot: 'bg-[#22C55E] animate-pulse' },
  New: { label: 'New', className: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30' },
  Contacted: { label: 'Contacted', className: 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30' },
  'In Discussion': { label: 'In Discussion', className: 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30' },
  Converted: { label: 'Converted', className: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30' },
  'Not Interested': { label: 'Not Interested', className: 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30' },
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
    body: `Hi there,\n\nThanks for reaching out about running a pilot program with Certifyd. We would love to collaborate with your placement cell and provide our ROI tools for your students.\n\nCould we schedule a quick 15-minute call this week to align on the batch size and timeline?\n\nBest regards,\nCertifyd Ops Team`,
  },
  {
    title: 'Partnership Opportunity',
    subject: 'Re: Partnership Inquiry with Certifyd',
    body: `Hi there,\n\nThank you for reaching out! We are exciting about potential synergy and would love to explore a partnership.\n\nPlease share your availability for an introductory discussion next week.\n\nBest regards,\nCertifyd Ops Team`,
  },
  {
    title: 'Investor Follow-up',
    subject: 'Re: Investor Inquiry - Certifyd Platform Metrics',
    body: `Hi there,\n\nThank you for your interest in Certifyd. We are seeing strong organic growth across Bengaluru tech professionals using our AI calculation engine.\n\nI have attached our latest high-level traction summary. Let me know when you would be open for a chat.\n\nBest regards,\nCertifyd Ops Team`,
  },
];
