"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, Folder, FileText, Wrench, Award, Map, User } from 'lucide-react';
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

  // Don't show breadcrumb on home page or auth pages
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  // Split pathname into segments
  const paths = pathname.split('/').filter(Boolean);

  // Build the breadcrumb segments
  const segments = [
    { label: 'Home', href: '/', icon: ICONS.home, current: false }
  ];

  let currentPath = '';
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const isLast = index === paths.length - 1;
    
    // Format the label (capitalize, remove dashes)
    let label = path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    // Choose an icon based on the path
    let Icon = ICONS.default;
    if (path.toLowerCase().includes('tool')) Icon = ICONS.tools;
    else if (path.toLowerCase().includes('cert')) Icon = ICONS.cert;
    else if (path.toLowerCase().includes('roadmap')) Icon = ICONS.roadmap;
    else if (path.toLowerCase().includes('profile')) Icon = ICONS.profile;

    segments.push({
      label,
      href: isLast ? null : currentPath,
      icon: Icon,
      current: isLast
    });

    // If this is the 'tools' segment and a path is chosen, inject the chosen path
    if (path.toLowerCase() === 'tools' && modeLocked && mode) {
      const activeMode = MODES.find(m => m.id === mode);
      if (activeMode) {
        segments.push({
          label: activeMode.label,
          href: '/choose-path', // Clicking it goes back to choose path
          icon: activeMode.icon || ICONS.default,
          current: false
        });
      }
    }
  });

  return (
    <div className="w-full px-4 md:px-6 mt-0 mb-0 pt-2 z-10 relative">
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
    </div>
  );
}
