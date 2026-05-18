/**
 * IntersectionGraphic — FIG 0.2 // ROI CALCULATOR
 *
 * Two bold isometric lines: dashed grey (cost), bright solid (gain).
 * A pulsing light travels along the gain line.
 * At intersection (break-even), a sustained glowing ripple radiates outward.
 * Theme-aware.
 */
import { useEffect, useRef, useState } from 'react';

// All points in isometric space, then projected via g transform="translate(110,110) scale(1,0.5) rotate(45)"
// Cost line: dashed, dim — goes diagonally downward-left
// Gain line: solid, bright — crosses cost, rises steeply

// In screen (post-transform) coordinates, we define the two lines:
// We work in the SVG local space (before iso transform) and let SVG do it.

function IntersectionGraphic({ isDark = true }) {
  const [pulseT, setPulseT] = useState(0);     // 0..1 position along gain line
  const [rippleScale, setRippleScale] = useState(0); // 0..1+ expanding ring
  const [rippleOpacity, setRippleOpacity] = useState(0);
  const [nodeGlow, setNodeGlow] = useState(0); // 0..1 intersection node brightness
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const phaseRef = useRef('pulse'); // 'pulse' | 'ripple'

  const GAIN_COLOR = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(34,35,38,0.95)';
  const COST_COLOR = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
  const GRID_COLOR = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const NODE_COLOR = isDark ? '#ffffff' : '#222326';
  const RIPPLE_COLOR = isDark ? 'rgba(255,255,255,' : 'rgba(34,35,38,';
  const PULSE_COLOR = isDark ? '#ffffff' : '#222326';

  // Gain line points (in iso-local space before transform)
  const gainPts = [
    { x: -80, y: 80 },   // bottom-left start
    { x: -20, y: 20 },   // midway up
    { x: 40,  y: -40 },  // intersection region
    { x: 90,  y: -90 },  // top-right end
  ];

  // Cost line: straighter, flatter, dashed
  const costPts = [
    { x: -90, y: 30 },
    { x: 0,   y: -10 },
    { x: 90,  y: -50 },
  ];

  // Intersection point (approximate midpoint where they visually cross)
  const IX = 30, IY = -38;

  // Interpolate along gain line
  function gainPos(t) {
    const total = gainPts.length - 1;
    const seg = t * total;
    const i = Math.min(Math.floor(seg), total - 1);
    const f = seg - i;
    const a = gainPts[i], b = gainPts[i + 1];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  useEffect(() => {
    const PULSE_DUR = 2200;  // ms for pulse to traverse
    const HOLD_AT_END = 400;
    const RIPPLE_DUR = 1400;
    const PAUSE = 900;

    function animate(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      if (phaseRef.current === 'pulse') {
        const t = Math.min(elapsed / PULSE_DUR, 1);
        setPulseT(t);

        // When pulse hits intersection region (~t=0.55-0.7), grow node glow
        if (t > 0.5 && t < 0.8) {
          setNodeGlow((t - 0.5) / 0.3);
        }

        if (t >= 1) {
          // Switch to ripple
          phaseRef.current = 'ripple';
          startRef.current = ts + HOLD_AT_END;
          setNodeGlow(1);
        }
      } else if (phaseRef.current === 'ripple') {
        if (elapsed < 0) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }
        const t = Math.min((elapsed) / RIPPLE_DUR, 1);
        setRippleScale(t);
        setRippleOpacity(Math.max(0, 1 - t * 1.1));

        if (t >= 1) {
          // Reset
          phaseRef.current = 'pulse';
          startRef.current = null;
          setPulseT(0);
          setRippleScale(0);
          setRippleOpacity(0);
          setNodeGlow(0.3); // keep node slightly glowing
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const pulsePos = gainPos(pulseT);
  const gainPolyline = gainPts.map(p => `${p.x},${p.y}`).join(' ');
  const costPolyline = costPts.map(p => `${p.x},${p.y}`).join(' ');
  const rippleR = rippleScale * 70;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 220 210" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <filter id="ig-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="ig-glow-hard" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Isometric transform group */}
        <g transform="translate(110, 118) scale(1, 0.5) rotate(45)">

          {/* Subtle ground grid */}
          <g stroke={GRID_COLOR} strokeWidth="0.8">
            {[-90, -60, -30, 0, 30, 60, 90].map(v => (
              <g key={v}>
                <line x1={v} y1={-90} x2={v} y2={90} />
                <line x1={-90} y1={v} x2={90} y2={v} />
              </g>
            ))}
          </g>

          {/* Cost line — dashed, dim */}
          <polyline
            points={costPolyline}
            fill="none"
            stroke={COST_COLOR}
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gain line — bold, solid */}
          <polyline
            points={gainPolyline}
            fill="none"
            stroke={GAIN_COLOR}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ig-glow-hard)"
          />

          {/* Ripple rings at intersection */}
          {rippleR > 0 && (
            <>
              <circle
                cx={IX} cy={IY}
                r={rippleR}
                fill="none"
                stroke={`${RIPPLE_COLOR}${(rippleOpacity * 0.6).toFixed(3)})`}
                strokeWidth="1"
              />
              <circle
                cx={IX} cy={IY}
                r={rippleR * 0.6}
                fill="none"
                stroke={`${RIPPLE_COLOR}${(rippleOpacity * 0.45).toFixed(3)})`}
                strokeWidth="0.8"
              />
            </>
          )}

          {/* Intersection node — stays glowing */}
          {nodeGlow > 0 && (
            <>
              <circle
                cx={IX} cy={IY}
                r={5 + nodeGlow * 3}
                fill="none"
                stroke={NODE_COLOR}
                strokeWidth="0.8"
                opacity={nodeGlow * 0.3}
                filter="url(#ig-glow)"
              />
              <circle
                cx={IX} cy={IY} r={3}
                fill={NODE_COLOR}
                opacity={0.4 + nodeGlow * 0.6}
                filter="url(#ig-glow)"
              />
            </>
          )}

          {/* Intersection node — always visible small dot */}
          <circle cx={IX} cy={IY} r={2} fill={NODE_COLOR} opacity={0.35 + nodeGlow * 0.5} />

          {/* Pulse dot traveling along gain line */}
          <circle
            cx={pulsePos.x}
            cy={pulsePos.y}
            r={3.5}
            fill={PULSE_COLOR}
            filter="url(#ig-glow)"
            opacity={0.7 + Math.sin(pulseT * Math.PI) * 0.3}
          />

          {/* Start and end nodes */}
          {gainPts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === 0 || i === gainPts.length - 1 ? 2.5 : 1.5}
              fill={NODE_COLOR} opacity={0.4} />
          ))}

        </g>
      </svg>
    </div>
  );
}

export default IntersectionGraphic;
