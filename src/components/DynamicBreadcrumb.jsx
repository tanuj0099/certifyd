"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, Folder, FileText, Wrench, Award, Map, User, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useJourneyStore } from '@/store/useJourneyStore';
import { MODES } from '@/components/ModeSelector';

const ICONS = {
  home: Home,
  tools: Wrench,
  cert: Award,
  roadmap: Map,
  profile: User,
  default: FileText
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const mode = useJourneyStore((s) => s.mode);
  const modeLocked = useJourneyStore((s) => s.modeLocked);
  const sourceTool = useJourneyStore((s) => s.sourceTool);
  const clearSourceTool = useJourneyStore((s) => s.clearSourceTool);

  // Clear sourceTool if we go to Home or Tools index
  useEffect(() => {
    if (pathname === '/' || pathname === '/tools') {
      clearSourceTool();
    }
  }, [pathname, clearSourceTool]);

  // Don't show breadcrumb on home page or auth pages
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  // Split pathname into segments
  let paths = pathname.split('/').filter(Boolean);

  // Logical Path overrides
  if (paths.includes('offer-analysis') || paths.includes('cert-radar') || paths.includes('market')) {
    if (paths[0] !== 'tools') {
      paths = ['tools', ...paths];
    }
  }

  // Build the breadcrumb segments
  const segments = [
    { label: 'Home', href: '/', icon: ICONS.home, current: false }
  ];

  let currentPath = '';
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const isLast = index === paths.length - 1;
    
    // Format the label
    let label = path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (path === 'roi') label = 'ROI Calculator';
    if (path === 'cert-radar') label = 'Cert Radar';
    if (path === 'offer-analysis') label = 'Offer Analysis';
    
    let Icon = ICONS.default;
    if (path === 'tools') Icon = ICONS.tools;
    else if (path.includes('cert')) Icon = ICONS.cert;
    else if (path.includes('roadmap')) Icon = ICONS.roadmap;
    else if (path.includes('profile')) Icon = ICONS.profile;

    segments.push({
      label,
      href: isLast ? null : currentPath,
      icon: Icon,
      current: isLast
    });

    // If we are showing a tool page and we came from another tool, inject it!
    if (isLast && sourceTool && sourceTool.path !== pathname) {
      // Insert source tool right before the current tool
      segments.splice(segments.length - 1, 0, {
        label: sourceTool.name,
        href: sourceTool.path,
        icon: ICONS.tools,
        current: false
      });
    }



  });

  return (
    <div className="w-full px-4 md:px-6 mt-0 mb-0 pt-2 z-10 relative flex items-center justify-between">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-nowrap items-center gap-1.5 text-[11px] sm:text-sm" style={{ color: 'var(--text-3)', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <AnimatePresence>
            {segments.map((segment, index) => {
              const Icon = segment.icon;
              return (
                <motion.li
                  key={segment.label + index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 24 }}
                  className="flex items-center"
                >
                  {segment.href ? (
                    <Link
                      href={segment.href}
                      className="flex items-center gap-1.5 rounded-sm px-1 py-0.5 transition-colors hover-text"
                    >
                      <Icon className="w-3.5 h-3.5 opacity-70" />
                      <span className={index === 0 ? "hidden sm:inline-block" : ""}>{segment.label}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-sm px-1 py-0.5 font-medium" style={{ color: 'var(--text)' }}>
                      <Icon className="w-3.5 h-3.5 opacity-80" />
                      {segment.label}
                    </span>
                  )}
                  {index < segments.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-0.5 opacity-50" />
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      </nav>

      {modeLocked && mode && (() => {
        const activeMode = MODES.find(m => m.id === mode);
        if (!activeMode) return null;
        return (
          <Link href="/choose-path" className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono tracking-wide rounded-full border border-dashed transition-opacity hover:opacity-80 flex-shrink-0" style={{
            borderColor: activeMode.color + '66',
            color: activeMode.color,
            background: activeMode.color + '15'
          }}>
            <span>{activeMode.label}</span>
            <RotateCcw className="w-2.5 h-2.5 opacity-70" />
          </Link>
        )
      })()}
    </div>
  );
}
