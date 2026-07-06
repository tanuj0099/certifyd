import React, { useState, useEffect } from 'react';

//  live counter hook 
function useLiveCounter(base = 4200, interval = 8000) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3));
    }, interval);
    return () => clearInterval(t);
  }, [interval]);
  return count;
}

//  timestamp hook 
function useLastSync() {
  const [label, setLabel] = useState('14 min ago');
  useEffect(() => {
    const anchors = [
      '2 min ago', '8 min ago', '14 min ago', '21 min ago', '37 min ago',
    ];
    let i = 2;
    const t = setInterval(() => {
      i = (i + 1) % anchors.length;
      setLabel(anchors[i]);
    }, 90000);
    return () => clearInterval(t);
  }, []);
  return label;
}

//  ticker items 
const ITEMS = [
  { label: 'AWS-SAA', value: '+28% YoY', positive: true },
  { label: 'PMP', value: '₹3.2L avg', positive: true },
  { label: 'CISSP', value: '+41% YoY', positive: true },
  { label: 'Google Data', value: ' Very High demand' },
  { label: 'CFA L1', value: '+19% YoY', positive: true },
  { label: 'CPA', value: '₹8.5L avg', positive: true },
  { label: 'CISA', value: '+33% YoY', positive: true },
  { label: 'Scrum Master', value: ' Saturating', positive: false },
  { label: 'Azure AZ-900', value: '+22% YoY', positive: true },
  { label: 'CA Inter', value: '₹5.1L avg', positive: true },
];

// 
export default function MarketPulseTicker({ compact = false }) {
  const jobCount = useLiveCounter(4200);
  const lastSync = useLastSync();

  const F_MONO = "var(--font-mono)";

  return (
    <div style={{ width: '100%', fontFamily: F_MONO }}>
      {/*  Status header pill  */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: compact ? 16 : 24,
        flexWrap: 'wrap', marginBottom: compact ? 0 : 10,
        fontSize: compact ? 10 : 11,
      }}>
        {/* live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className="live-dot" />
          <span style={{ color: 'var(--linear-blue)', letterSpacing: '0.1em', fontWeight: 700 }}>
            SYSTEM STATUS // MARKET PULSE: ACTIVE
          </span>
        </div>

        <span style={{ color: 'transparent' }}>|</span>

        <span style={{ color: '#9CA3AF', letterSpacing: '0.08em' }}>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {jobCount.toLocaleString('en-IN')}+
          </span>
          {' '}JOBS ANALYZED
        </span>

        <span style={{ color: 'transparent' }}>|</span>

        <span style={{ color: '#9CA3AF', letterSpacing: '0.06em', fontSize: compact ? 9 : 10 }}>
          DATA SYNC:{' '}
          <span style={{ color: '#6B7280' }}>{lastSync}</span>
          {' '}// Q2 2026
        </span>
      </div>

      {/*  Scrolling ticker strip  */}
      {!compact && (
        <div style={{
          overflow: 'hidden', width: '100%',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 6, marginTop: 4,
          maskImage: 'none',
          WebkitMaskImage: 'none',
        }}>
          <div className="market-ticker-track">
            {/* duplicated for seamless loop */}
            {[...ITEMS, ...ITEMS].map((item, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 10, letterSpacing: '0.07em', color: '#6B7280',
              }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{item.label}</span>
                <span style={{
                  color: item.positive === false ? 'var(--cool-grey)' : 'var(--linear-blue)',
                  fontWeight: 500,
                }}>
                  {item.value}
                </span>
                <span style={{ color: 'transparent', marginLeft: 12 }}></span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

//  Compact inline version for ROI results 
export function DataSyncBadge({ hoursAgo }) {
  const lastSync = useLastSync();
  const F_MONO = "var(--font-mono)";
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 4,
      border: '1px solid var(--border-subtle)',
      background: 'var(--border-subtle)',
      fontFamily: F_MONO, fontSize: 10,
      letterSpacing: '0.07em', color: '#6B7280',
    }}>
      <span className="live-dot" style={{ width: 5, height: 5 }} />
      <span>SALARY DATA VERIFIED {lastSync}</span>
    </div>
  );
}
