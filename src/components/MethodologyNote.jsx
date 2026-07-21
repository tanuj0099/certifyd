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
          color: 'var(--text-3)',
          fontFamily: FM,
          fontSize: compact ? '11px' : '12px',
          cursor: 'pointer',
          padding: '4px 0',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent, var(--brand-primary, #00D4A8))')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
      >
        <Info size={compact ? 13 : 15} style={{ color: 'var(--accent, var(--brand-primary, #00D4A8))' }} />
        <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          How we calculate these numbers
        </span>
      </button>

      {/* Expanded Inline Drawer */}
      {expanded && (
        <div
          style={{
            marginTop: '12px',
            padding: '16px 18px',
            background: 'var(--card, var(--surface, rgba(15, 23, 42, 0.6)))',
            border: '1px solid var(--border-mid, var(--border, rgba(255, 255, 255, 0.15)))',
            borderRadius: '12px',
            fontFamily: FS,
            fontSize: '13px',
            color: 'var(--text-2)',
            lineHeight: 1.6,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <ShieldCheck size={16} style={{ color: '#00D4A8' }} /> Attribution &amp; Methodology Honesty
            </span>
            <button
              onClick={() => setExpanded(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          <ul style={{ margin: '0 0 12px 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-2)' }}>
            <li>
              <strong style={{ color: 'var(--text)' }}>Correlational Medians:</strong> Salary and ROI projections represent market medians across Indian tech hubs — half of verified professionals sit above, half below. Individual results vary with prior experience and negotiation.
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Proximity Adjusted:</strong> Outcome data (`outcomes`) is self-reported by verified Indian engineers and adjusted by `months_since_cert` to account for natural career progression versus certification impact.
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Multi-Source Confidence:</strong> Demand scores rely on multi-source indexing (`sample_confidence`). Where sample sizes fall below our strict threshold (20+ records), we explicitly state <em>Not enough data yet</em> rather than falling back to placeholders.
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--accent, var(--brand-primary, #00D4A8))',
              fontFamily: FM,
              fontSize: '12px',
              cursor: 'pointer',
              padding: '2px 0',
              fontWeight: 700,
            }}
          >
            <span>View detailed data sources &amp; audit logs</span>
            <ExternalLink size={13} />
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
            background: 'var(--overlay-scrim, rgba(15, 23, 42, 0.65))',
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
              background: 'var(--surface)',
              border: '1px solid var(--border-mid, rgba(255, 255, 255, 0.15))',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '580px',
              padding: '28px',
              color: 'var(--text)',
              fontFamily: FS,
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database style={{ color: 'var(--accent, #00D4A8)' }} size={20} /> Certifyd Data Architecture &amp; Sources
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-3)', fontFamily: FM }}>
                  Real-time pipeline verification
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13.5px', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.6 }}>
              <div style={{ background: 'var(--bg)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '14px', fontWeight: 700 }}>
                  1. Market Demand Observations (`market_demand_observations`)
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)' }}>
                  Demand counts are aggregated from automated weekly Adzuna API pulls across top Indian tech hubs (Bengaluru, Hyderabad, Pune, Gurugram) combined with quarterly manual audits of Naukri and LinkedIn job listings logged by our operations team.
                </p>
              </div>

              <div style={{ background: 'var(--bg)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 6px', color: '#00D4A8', fontSize: '14px', fontWeight: 700 }}>
                  2. Verified Outcomes (`outcomes`) &amp; Attribution Proximity
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)' }}>
                  When users submit salary revisions, our verification modal records self-reported attribution factors (e.g., job switches, internal appraisals, parallel upskilling) alongside exact `months_since_cert` to prevent over-attributing natural career progression to a certificate.
                </p>
              </div>

              <div style={{ background: 'var(--bg)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 6px', color: '#E8C547', fontSize: '14px', fontWeight: 700 }}>
                  3. Strict Sample Size Guard (20+ Records)
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)' }}>
                  Any aggregate percentage, average payback window, or market demand metric requires at least 20 verified data points. If a domain or certification falls below this threshold, the system displays an honest &quot;Not enough data yet&quot; notification rather than synthetic fallbacks.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'var(--accent, #00D4A8)',
                  color: 'var(--bg, #0F1218)',
                  border: 'none',
                  fontWeight: 700,
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
