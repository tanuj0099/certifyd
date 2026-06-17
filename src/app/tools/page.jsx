'use client';

import Link from 'next/link';
import { TOOLS } from '@/data/toolsData';
import { ArrowRight } from 'lucide-react';
import { MarketingFooter } from '@/components/MarketingPageShell.jsx';

const FM = "var(--font-mono)";
const FS = "var(--font-sans)";

function ToolCard({ tool }) {
  const Icon = tool.icon;
  return (
    <Link href={tool.path} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          padding: '24px',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--text-3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
              {Icon ? <Icon size={20} /> : <div />}
            </div>
            <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              // {tool.tag}
            </div>
          </div>
          {tool.badge && (
            <div style={{ padding: '4px 8px', borderRadius: '4px', background: tool.badgeColor + '15', color: tool.badgeColor, fontFamily: FM, fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tool.badge}
            </div>
          )}
        </div>
        
        <h3 style={{
          margin: 0, fontFamily: FS, fontSize: '18px',
          fontWeight: 700, letterSpacing: '-0.01em',
          color: 'var(--text)', lineHeight: 1.2,
          marginBottom: '8px'
        }}>
          {tool.label}
        </h3>

        <p style={{
          margin: 0, fontFamily: FS, fontSize: '14px',
          color: 'var(--text-3)', lineHeight: 1.6, flex: 1,
          marginBottom: '16px'
        }}>
          {tool.desc}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: FM, fontSize: '11px', letterSpacing: '0.08em',
          color: 'var(--text-4)', textTransform: 'uppercase',
        }}>
          Open tool <ArrowRight size={11} />
        </div>
      </div>
    </Link>
  )
}

export default function ToolsIndex() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="page-top-pad w-full max-w-6xl mx-auto px-4 md:px-6 py-8 pb-24">
        <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
          <h1 style={{ fontFamily: FS, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--text)', margin: '0 0 16px' }}>
            Career Navigation Tools
          </h1>
          <p style={{ fontFamily: FS, fontSize: '15px', color: 'var(--text-3)', lineHeight: 1.7, maxWidth: '54ch', margin: 0 }}>
            Every tool is built around one question: <em style={{ color: 'var(--text-2)' }}>will this cert pay off for you?</em> Pick your starting point.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: '16px',
        }}>
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
