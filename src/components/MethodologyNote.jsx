import React, { useState } from 'react';
import { Info, X, ExternalLink, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

const FM = 'var(--font-mono)';
const FS = 'var(--font-sans)';

export default function MethodologyNote({ compact = false, style = {} }) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ ...style }}>
      {/* Trigger Toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-3, #94A3B8)',
          fontFamily: FM,
          fontSize: compact ? '11px' : '12px',
          cursor: 'pointer',
          padding: '4px 0',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--linear-blue, #60A5FA)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3, #94A3B8)')}
      >
        <Info size={compact ? 13 : 15} style={{ color: 'var(--linear-blue, #60A5FA)' }} />
        <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          How we calculate these numbers
        </span>
      </button>

      {/* Expanded Inline Drawer */}
      {expanded && (
        <div
          style={{
            marginTop: '10px',
            padding: '14px 16px',
            background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            borderRadius: '8px',
            fontFamily: FS,
            fontSize: '12px',
            color: 'var(--text-2, #E2E8F0)',
            lineHeight: 1.6,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text, #F8FAFC)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#10B981" /> Attribution & Methodology Honesty
            </span>
            <button
              onClick={() => setExpanded(false)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>

          <ul style={{ margin: '0 0 10px 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <strong>Correlational Medians:</strong> Salary and ROI projections represent market medians across Indian tech hubs — half of verified professionals sit above, half below. Individual results vary with prior experience and negotiation.
            </li>
            <li>
              <strong>Proximity Adjusted:</strong> Outcome data (`outcomes`) is self-reported by verified Indian engineers and adjusted by `months_since_cert` to account for natural career progression versus certification impact.
            </li>
            <li>
              <strong>Multi-Source Confidence:</strong> Demand scores rely on multi-source indexing (`sample_confidence`). Where sample sizes fall below our strict threshold (20+ records), we explicitly state <em>Not enough data yet</em> rather than falling back to placeholders.
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'transparent',
              border: 'none',
              color: 'var(--linear-blue, #60A5FA)',
              fontFamily: FM,
              fontSize: '11px',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 600,
            }}
          >
            <span>View detailed data sources & audit logs</span>
            <ExternalLink size={12} />
          </button>
        </div>
      )}

      {/* Full Data Sources Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#0F1218',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              color: '#F8FAFC',
              fontFamily: FS,
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database color="#60A5FA" size={20} /> Certifyd Data Architecture & Sources
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8', fontFamily: FM }}>
                  Real-time pipeline verification
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#CBD5E1', spaceY: '14px', display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.6 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ margin: '0 0 6px', color: '#60A5FA', fontSize: '13px', fontWeight: 600 }}>
                  1. Market Demand Observations (`market_demand_observations`)
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                  Demand counts are aggregated from automated weekly Adzuna API pulls across top Indian tech hubs (Bengaluru, Hyderabad, Pune, Gurugram) combined with quarterly manual audits of Naukri and LinkedIn job listings logged by our operations team.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ margin: '0 0 6px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
                  2. Verified Outcomes (`outcomes`) & Attribution Proximity
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                  When users submit salary revisions, our verification modal records self-reported attribution factors (e.g., job switches, internal appraisals, parallel upskilling) alongside exact `months_since_cert` to prevent over-attributing natural career progression to a certificate.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ margin: '0 0 6px', color: '#F59E0B', fontSize: '13px', fontWeight: 600 }}>
                  3. Strict Sample Size Guard (20+ Records)
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                  Any aggregate percentage, average payback window, or market demand metric requires at least 20 verified data points. If a domain or certification falls below this threshold, the system displays an honest "Not enough data yet" notification rather than synthetic fallbacks.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#60A5FA',
                  color: '#0F1218',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
