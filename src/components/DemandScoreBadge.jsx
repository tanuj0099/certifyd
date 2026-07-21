import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const FM = 'var(--font-mono)';
const FS = 'var(--font-sans)';

export default function DemandScoreBadge({
  certName,
  city = 'Bengaluru',
  role = 'Cloud Solutions Architect',
  demandScore = null,
  sampleConfidence = null, // 'high', 'medium', 'low', or null/undefined
  lastObservedAt = null,
  style = {},
}) {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasData = demandScore !== null && demandScore !== undefined && demandScore > 0;

  const handleRequestPull = async () => {
    setRequesting(true);
    setErrorMsg('');
    try {
      // Log demand request to market_demand_observations with source='user_request'
      const { error } = await supabase.from('market_demand_observations').insert({
        cert_name: certName || 'Unknown Certification',
        city: city || 'Bengaluru',
        role: role || 'Tech Role',
        open_roles_count: null,
        source: 'user_request',
        observed_at: new Date().toISOString().split('T')[0],
        notes: `User requested demand pull from frontend badge for '${certName}' in '${city}'`,
      });

      if (error) {
        console.warn('Could not log user demand request to supabase directly:', error.message);
      }
      setRequested(true);
    } catch (e) {
      console.warn('Error submitting pull request:', e);
      setRequested(true);
    } finally {
      setRequesting(false);
    }
  };

  if (!hasData || !sampleConfidence || sampleConfidence === 'low') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontFamily: FS,
          fontSize: '12px',
          color: 'var(--text-2, #E2E8F0)',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
          <AlertCircle size={14} />
          <span>
            {hasData ? `Demand Score: ${demandScore}/100 (` : 'Demand Score: '}
            <strong style={{ color: '#E2E8F0', fontFamily: FM }}>
              {hasData ? 'Low Confidence/Unverified)' : 'Not enough data yet'}
            </strong>
          </span>
        </div>

        {!requested ? (
          <button
            type="button"
            onClick={handleRequestPull}
            disabled={requesting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'var(--linear-blue, #60A5FA)',
              color: '#0F1218',
              border: 'none',
              fontFamily: FM,
              fontSize: '10px',
              fontWeight: 600,
              cursor: requesting ? 'wait' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            <RefreshCw size={11} className={requesting ? 'animate-spin' : ''} />
            <span>{requesting ? 'Requesting...' : 'Request a pull for this cert'}</span>
          </button>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#10B981',
              fontFamily: FM,
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={12} /> Pull Requested
          </span>
        )}
      </div>
    );
  }

  // High or Medium confidence badge
  const isHigh = sampleConfidence && sampleConfidence.toLowerCase().includes('high');
  const badgeColor = isHigh ? '#10B981' : '#F59E0B'; // Green for high, Yellow for medium
  const badgeBg = isHigh ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
  const badgeBorder = isHigh ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 10px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: FS,
        fontSize: '12px',
        ...style,
      }}
    >
      <span style={{ color: 'var(--text-2, #E2E8F0)' }}>Demand Score:</span>
      <strong style={{ fontFamily: FM, fontSize: '13px', color: '#F8FAFC' }}>{demandScore}/100</strong>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 7px',
          borderRadius: '999px',
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          color: badgeColor,
          fontFamily: FM,
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <ShieldCheck size={11} />
        {isHigh ? 'High Confidence' : 'Medium Confidence'}
      </span>

      {lastObservedAt && (
        <span style={{ fontSize: '10px', color: '#64748B', fontFamily: FM }}>
          Verified {new Date(lastObservedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </span>
      )}
    </div>
  );
}
