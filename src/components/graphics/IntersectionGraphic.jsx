/**
 * IntersectionGraphic - FIG 0.2 // THE INTERSECTION  "Calculate the payback"
 *
 * Concept: 5 stacked isometric rectangular slabs that mechanically breathe apart -
 * separating to reveal glowing inner geometry/circuit traces between layers.
 * Represents the layers of salary, cost, and payback "opening up" for inspection.
 * Inspired by Linear's stacked-layers FIG 0.2 illustration.
 *
 * Pure wireframe. No fills. Theme-aware via CSS vars.
 * Works on both light (#FFFFFF) and dark (#222326) backgrounds.
 */
import { useEffect, useRef, useState } from 'react';

const VW = 220;
const VH = 210;

//  Slab definitions 
const SLABS = [
  { id: 0, hw: 52, hd: 24, detail: true,  label: '5YR GAIN'   },
  { id: 1, hw: 44, hd: 20, detail: false, label: null          },
  { id: 2, hw: 58, hd: 28, detail: true,  label: 'BREAK-EVEN' },
  { id: 3, hw: 40, hd: 18, detail: false, label: null          },
  { id: 4, hw: 48, hd: 22, detail: false, label: 'CERT COST'  },
];

const SLAB_THICK = 9;   // side-wall height px
const REST_GAP   = 2;   // px gap between slabs at rest
const MAX_SPREAD = 26;  // extra px gap at full explode

//  Iso slab geometry 
// Top face: diamond parallelogram. Left + right side walls.
function buildSlab(cx, cy, hw, hd, thick) {
  // Top face corners
  const top   = { x: cx,      y: cy - hd };
  const right = { x: cx + hw, y: cy - hd * 0.5 + hd * 0.5 };
  const bot   = { x: cx,      y: cy };
  const left  = { x: cx - hw, y: cy - hd * 0.5 + hd * 0.5 };

  // Use proper iso: top-face is a rhombus
  // 4 corners: N (back), E (right), S (front), W (left)
  const N = { x: cx,      y: cy - hd };
  const E = { x: cx + hw, y: cy - hd * 0.5 };
  const S = { x: cx,      y: cy };
  const W = { x: cx - hw, y: cy - hd * 0.5 };

  const topFace  = [N, E, S, W];

  // Left wall: W  S  S+thick  W+thick
  const leftFace = [
    W,
    S,
    { x: S.x, y: S.y + thick },
    { x: W.x, y: W.y + thick },
  ];

  // Right wall: S  E  E+thick  S+thick
  const rightFace = [
    S,
    E,
    { x: E.x, y: E.y + thick },
    { x: S.x, y: S.y + thick },
  ];

  return { topFace, leftFace, rightFace, N, E, S, W };
}

function pts(arr) {
  return arr.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

//  Easing 
function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

//  Component 
export default function IntersectionGraphic() {
  const [explodeT, setExplodeT] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const EXPLODE_DUR  = 1800;
    const HOLD_DUR     = 2400;
    const COLLAPSE_DUR = 1400;
    const PAUSE_DUR    = 900;
    const WAIT_DUR     = 500;

    let phase = 'wait';
    let phaseStart = null;

    function tick(ts) {
      if (!phaseStart) phaseStart = ts;
      const el = ts - phaseStart;

      if (phase === 'wait') {
        if (el > WAIT_DUR) { phase = 'exploding'; phaseStart = ts; }
      } else if (phase === 'exploding') {
        const t = Math.min(el / EXPLODE_DUR, 1);
        setExplodeT(easeOutExpo(t));
        if (t >= 1) { phase = 'hold'; phaseStart = ts; }
      } else if (phase === 'hold') {
        if (el > HOLD_DUR) { phase = 'collapsing'; phaseStart = ts; }
      } else if (phase === 'collapsing') {
        const t = Math.min(el / COLLAPSE_DUR, 1);
        setExplodeT(1 - easeInOutCubic(t));
        if (t >= 1) { setExplodeT(0); phase = 'pause'; phaseStart = ts; }
      } else if (phase === 'pause') {
        if (el > PAUSE_DUR) { phase = 'wait'; phaseStart = ts; }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  //  Layout: slabs spread upward as explodeT  1 
  const CX      = VW * 0.5;
  const BASE_CY = VH * 0.72;

  const slabData = SLABS.map((slab, i) => {
    const spread = i * (MAX_SPREAD * explodeT);
    const cy = BASE_CY - i * (SLAB_THICK + REST_GAP) - spread;
    const geom = buildSlab(CX, cy, slab.hw, slab.hd, SLAB_THICK);
    const gapAbove = i > 0 ? MAX_SPREAD * explodeT - REST_GAP : 0;
    return { ...slab, cy, geom, gapAbove, i };
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <filter id="ig3-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ig3-glow-lg" x="-140%" y="-140%" width="380%" height="380%">
            <feGaussianBlur stdDeviation="4.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Draw bottom  top (painter's algorithm) */}
        {[...slabData].map((slab) => {
          const { geom, hw, hd, cy, gapAbove, i } = slab;
          const isTop       = i === SLABS.length - 1;
          const gapVisible  = gapAbove > 3;
          const innerReveal = Math.max(0, Math.min(1, (gapAbove - 6) / 14));
          const hasLabel    = slab.label && explodeT > 0.35;
          const labelOp     = Math.min(1, (explodeT - 0.35) / 0.5);

          return (
            <g key={slab.id}>

              {/* Right wall */}
              <polygon
                points={pts(geom.rightFace)}
                fill="none"
                stroke="var(--text)"
                strokeWidth="0.6"
                strokeLinejoin="round"
                opacity="0.5"
              />

              {/* Left wall */}
              <polygon
                points={pts(geom.leftFace)}
                fill="none"
                stroke="var(--text)"
                strokeWidth="0.6"
                strokeLinejoin="round"
                opacity="0.38"
              />

              {/* Top face */}
              <polygon
                points={pts(geom.topFace)}
                fill="none"
                stroke="var(--text)"
                strokeWidth={isTop ? 1.1 : 0.85}
                strokeLinejoin="round"
                filter={isTop && explodeT > 0.5 ? 'url(#ig3-glow)' : undefined}
              />

              {/* Detail cross on top face */}
              {slab.detail && (
                <g opacity="0.22">
                  <line
                    x1={geom.W.x + hw * 0.15} y1={geom.W.y + hd * 0.05}
                    x2={geom.E.x - hw * 0.15} y2={geom.E.y + hd * 0.05}
                    stroke="var(--text)" strokeWidth="0.4"
                  />
                  <line
                    x1={geom.N.x} y1={geom.N.y + hd * 0.15}
                    x2={geom.S.x} y2={geom.S.y - hd * 0.15}
                    stroke="var(--text)" strokeWidth="0.4"
                  />
                </g>
              )}

              {/*  Gap interior: circuit traces between layers  */}
              {gapVisible && innerReveal > 0 && (
                <g opacity={innerReveal * 0.75}>
                  {/* Horizontal trace lines inside the gap */}
                  {[0.3, 0.6].map((frac, li) => {
                    // gap sits between bottom of this slab and top of slab below
                    const gapTopY    = geom.S.y + SLAB_THICK;
                    const gapBotY    = gapTopY + gapAbove - REST_GAP;
                    const traceY     = gapTopY + (gapBotY - gapTopY) * frac;
                    const traceW     = hw * (0.55 + li * 0.1);
                    // Constrain x to the iso diamond shape at this y (approx)
                    const x1 = CX - traceW;
                    const x2 = CX + traceW * (0.6 + li * 0.2);
                    // Mid jog
                    const mx = CX + traceW * (li === 0 ? -0.1 : 0.2);
                    return (
                      <g key={li}>
                        <polyline
                          points={`${x1},${traceY} ${mx},${traceY} ${mx},${traceY + (li === 0 ? 3 : -3)} ${x2},${traceY + (li === 0 ? 3 : -3)}`}
                          fill="none"
                          stroke="var(--text)"
                          strokeWidth="0.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Node dot at jog */}
                        <circle
                          cx={mx} cy={traceY}
                          r={1.2}
                          fill="none"
                          stroke="var(--text)"
                          strokeWidth="0.55"
                          filter="url(#ig3-glow)"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Gap seam dashes */}
              {gapVisible && (
                <g opacity={Math.min(0.3, innerReveal * 0.5)}>
                  <line
                    x1={geom.leftFace[2].x}  y1={geom.leftFace[2].y}
                    x2={geom.leftFace[3].x}  y2={geom.leftFace[3].y}
                    stroke="var(--border-mid)" strokeWidth="0.4"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={geom.rightFace[2].x} y1={geom.rightFace[2].y}
                    x2={geom.rightFace[3].x} y2={geom.rightFace[3].y}
                    stroke="var(--border-mid)" strokeWidth="0.4"
                    strokeDasharray="2 2"
                  />
                </g>
              )}

              {/* Label leader + text */}
              {hasLabel && (
                <g opacity={labelOp * 0.7}>
                  <line
                    x1={geom.E.x}     y1={geom.E.y}
                    x2={geom.E.x + 8} y2={geom.E.y - 3}
                    stroke="var(--border-mid)" strokeWidth="0.5"
                  />
                  <text
                    x={geom.E.x + 10} y={geom.E.y - 1}
                    fontSize="5"
                    fill="var(--text-3)"
                    fontFamily="'JetBrains Mono', 'IBM Plex Mono', monospace"
                    letterSpacing="0.07em"
                  >
                    {slab.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/*  Top apex node - glows when exploded  */}
        {(() => {
          const top = slabData[slabData.length - 1];
          const n   = top.geom.N;
          return (
            <>
              <circle
                cx={n.x} cy={n.y} r={3.5}
                fill="none"
                stroke="var(--text)"
                strokeWidth="0.7"
                opacity={0.3 + explodeT * 0.65}
                filter={explodeT > 0.4 ? 'url(#ig3-glow)' : undefined}
              />
              <circle
                cx={n.x} cy={n.y} r={1.2}
                fill="var(--text)"
                opacity={0.4 + explodeT * 0.55}
              />
            </>
          );
        })()}

        {/*  Base shadow line  */}
        <line
          x1={CX - 52} y1={BASE_CY + SLAB_THICK + 5}
          x2={CX + 52} y2={BASE_CY + SLAB_THICK + 5}
          stroke="var(--border)" strokeWidth="0.5" opacity="0.45"
        />
      </svg>
    </div>
  );
}