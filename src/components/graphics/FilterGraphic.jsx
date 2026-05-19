/**
 * FilterGraphic — FIG 0.1 // THE FILTER
 *
 * Linear-style isometric wireframe. Pure outline geometry, zero fills.
 * A flat isometric grid platform with a cluster of wireframe cubes rising from it.
 * A glowing scanner plane sweeps across. Signal cubes elevate with crisp mechanical motion.
 * Monochrome white strokes on dark background — matches Linear's aesthetic exactly.
 */
import { useEffect, useRef, useState } from 'react';

// ─── Iso projection constants ───────────────────────────────
const TW = 16;   // tile half-width
const TH = 8;    // tile half-height = TW * 0.5
const ROWS = 7;
const COLS = 7;
const OX = 110;  // grid origin x (centred in 220px viewBox)
const OY = 58;   // grid origin y

// ─── Cube cluster — (row, col, height) ─────────────────────
// Mimics Linear's stacked cube cluster composition
const CUBE_DEFS = [
  { r: 2, c: 3, h: 1, signal: false },
  { r: 3, c: 2, h: 1, signal: false },
  { r: 3, c: 3, h: 2, signal: true  },
  { r: 3, c: 4, h: 1, signal: false },
  { r: 4, c: 3, h: 1, signal: true  },
  { r: 4, c: 4, h: 2, signal: true  },
  { r: 2, c: 4, h: 1, signal: false },
  { r: 4, c: 2, h: 1, signal: false },
];

// ─── Iso helpers ────────────────────────────────────────────
function isoCenter(r, c) {
  return {
    cx: OX + (c - r) * TW,
    cy: OY + (c + r) * TH,
  };
}

// Top face diamond — at vertical offset elev (upward = negative y)
function topFacePts(cx, cy, elev = 0) {
  const ey = cy - elev;
  return [
    [cx,      ey - TH],
    [cx + TW, ey],
    [cx,      ey + TH],
    [cx - TW, ey],
  ];
}

function ptsToStr(pts) {
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

// Left face (south-west vertical wall)
function leftFacePts(cx, cy, elev) {
  if (elev <= 0.5) return null;
  return [
    [cx - TW, cy],
    [cx,      cy + TH],
    [cx,      cy - elev + TH],
    [cx - TW, cy - elev],
  ];
}

// Right face (south-east vertical wall)
function rightFacePts(cx, cy, elev) {
  if (elev <= 0.5) return null;
  return [
    [cx,      cy + TH],
    [cx + TW, cy],
    [cx + TW, cy - elev],
    [cx,      cy - elev + TH],
  ];
}

// Build sorted grid cells (painter's algo — back to front)
function buildGrid() {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cells.push({ r, c, depth: r + c });
    }
  }
  cells.sort((a, b) => a.depth - b.depth || a.r - b.r);
  return cells;
}
const GRID = buildGrid();

// ─── Easing ─────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// ─── Component ──────────────────────────────────────────────
export default function FilterGraphic() {
  const [scanProgress, setScanProgress]     = useState(-1);   // -1 = hidden, 0..1 = sweeping
  const [elevProgress, setElevProgress]     = useState(0);    // 0..1 cube elevation spring
  const [elevated, setElevated]             = useState(false);
  const rafRef   = useRef(null);
  const timerRef = useRef(null);
  const elevRef  = useRef(0);

  // ─── Main animation loop ───────────────────────────────────
  useEffect(() => {
    const SCAN_DUR   = 1800;
    const ELEV_HOLD  = 2400;
    const RESET_DUR  = 600;
    const IDLE_GAP   = 1200;

    let phase = 'idle';
    let phaseStart = null;

    function tick(ts) {
      if (!phaseStart) phaseStart = ts;
      const elapsed = ts - phaseStart;

      if (phase === 'scanning') {
        const t = Math.min(elapsed / SCAN_DUR, 1);
        setScanProgress(t);
        if (t >= 1) {
          phase = 'elevating';
          phaseStart = ts;
          setElevated(true);
          setScanProgress(-1);
        }
      } else if (phase === 'elevating') {
        if (elapsed > ELEV_HOLD) {
          phase = 'resetting';
          phaseStart = ts;
          setElevated(false);
        }
      } else if (phase === 'resetting') {
        if (elapsed > RESET_DUR) {
          phase = 'idle';
          phaseStart = ts;
        }
      } else if (phase === 'idle') {
        if (elapsed > IDLE_GAP) {
          phase = 'scanning';
          phaseStart = ts;
          setScanProgress(0);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    // Stagger start
    timerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 600);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
  }, []);

  // ─── Spring elevation ──────────────────────────────────────
  useEffect(() => {
    let raf;
    const target = elevated ? 1 : 0;
    function spring() {
      const diff = target - elevRef.current;
      elevRef.current += diff * (elevated ? 0.10 : 0.13);
      setElevProgress(+elevRef.current.toFixed(4));
      if (Math.abs(diff) > 0.001) raf = requestAnimationFrame(spring);
      else { elevRef.current = target; setElevProgress(target); }
    }
    raf = requestAnimationFrame(spring);
    return () => cancelAnimationFrame(raf);
  }, [elevated]);

  // ─── Scanner column depth ──────────────────────────────────
  // Scanner sweeps from top-left to bottom-right in iso space
  const totalDepth  = ROWS + COLS; // 0 to 14
  const scanDepth   = scanProgress >= 0 ? scanProgress * (totalDepth + 2) - 1 : -999;

  // ─── Cube elevation amounts ────────────────────────────────
  const CUBE_H_UNIT = 18; // px per height unit

  // ─── Stroke style constants ───────────────────────────────
  const S_GRID   = { stroke: 'var(--border)',        strokeWidth: 0.5 };
  const S_CUBE   = { stroke: 'var(--border-mid)',     strokeWidth: 0.7 };
  const S_SIG    = { stroke: 'var(--text)',           strokeWidth: 0.8 };
  const S_SCAN   = { stroke: 'var(--text)',           strokeWidth: 0.9 };
  const S_ACTIVE = { stroke: 'var(--text)',           strokeWidth: 0.9 };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 220 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          {/* Soft glow for scanner and signal cubes */}
          <filter id="fg2-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="fg2-glow-lg" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Very subtle glow for scanner line */}
          <filter id="fg2-scan-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="var(--text)" floodOpacity="0.15" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="tinted" />
            <feMerge><feMergeNode in="tinted" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Flat grid platform ─────────────────────────────── */}
        <g>
          {GRID.map(({ r, c, depth }) => {
            const { cx, cy } = isoCenter(r, c);
            const underScan  = scanProgress >= 0 && Math.abs(depth - scanDepth) < 1.2;
            const strokeCol  = underScan ? 'var(--text-3)' : 'var(--border)';
            const sw         = underScan ? 0.7 : 0.45;
            const pts        = topFacePts(cx, cy, 0);

            return (
              <polygon
                key={`g-${r}-${c}`}
                points={ptsToStr(pts)}
                fill="none"
                stroke={strokeCol}
                strokeWidth={sw}
                strokeLinejoin="round"
              />
            );
          })}
        </g>

        {/* ── Scanner plane ──────────────────────────────────── */}
        {scanProgress >= 0 && (() => {
          // Iso-diagonal line at current scanDepth
          // All cells with r+c === scanDepth share a diagonal
          // Line from top-right corner of (0, scanDepth) to bottom-left of (scanDepth, 0) clipped
          const pts = [];
          for (let r = 0; r <= ROWS; r++) {
            const c = scanDepth - r;
            if (c < -0.5 || c > COLS + 0.5) continue;
            const cc = Math.max(0, Math.min(COLS, c));
            const rr = r;
            const { cx, cy } = isoCenter(rr, cc);
            pts.push([cx, cy - TH]);
          }
          if (pts.length < 2) return null;
          const opacity = Math.sin(scanProgress * Math.PI) * 0.85;
          return (
            <g opacity={opacity} filter="url(#fg2-scan-glow)">
              {/* Wide soft glow line */}
              <polyline
                points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="var(--text)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.06"
              />
              {/* Crisp scan line */}
              <polyline
                points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="var(--text)"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>
          );
        })()}

        {/* ── Wireframe cube cluster ─────────────────────────── */}
        {/* Sort cubes back-to-front by depth */}
        {[...CUBE_DEFS]
          .sort((a, b) => (a.r + a.c) - (b.r + b.c) || a.r - b.r)
          .map((cube, idx) => {
            const { cx, cy } = isoCenter(cube.r, cube.c);
            const baseElev   = cube.h * CUBE_H_UNIT;
            // Signal cubes get an extra lift during elevated phase
            const extraLift  = cube.signal ? elevProgress * 14 : 0;
            const totalElev  = baseElev + extraLift;
            const isActive   = cube.signal && elevProgress > 0.05;

            const s = isActive ? S_ACTIVE : S_CUBE;

            const topPts  = topFacePts(cx, cy, totalElev);
            const leftPts = leftFacePts(cx, cy, totalElev);
            const rightPts= rightFacePts(cx, cy, totalElev);

            return (
              <g key={`cube-${cube.r}-${cube.c}`} filter={isActive ? 'url(#fg2-glow)' : undefined}>
                {/* Right face */}
                {rightPts && (
                  <polygon
                    points={ptsToStr(rightPts)}
                    fill="none"
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth}
                    strokeLinejoin="round"
                    opacity={isActive ? 1 : 0.7}
                  />
                )}
                {/* Left face */}
                {leftPts && (
                  <polygon
                    points={ptsToStr(leftPts)}
                    fill="none"
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth}
                    strokeLinejoin="round"
                    opacity={isActive ? 1 : 0.6}
                  />
                )}
                {/* Top face */}
                <polygon
                  points={ptsToStr(topPts)}
                  fill="none"
                  stroke={s.stroke}
                  strokeWidth={s.strokeWidth}
                  strokeLinejoin="round"
                />
                {/* Inner cross detail on top face for signal cubes */}
                {isActive && (
                  <g opacity={elevProgress * 0.5}>
                    <line
                      x1={cx} y1={cy - totalElev - TH}
                      x2={cx} y2={cy - totalElev + TH}
                      stroke="var(--text)" strokeWidth="0.4"
                    />
                    <line
                      x1={cx - TW} y1={cy - totalElev}
                      x2={cx + TW} y2={cy - totalElev}
                      stroke="var(--text)" strokeWidth="0.4"
                    />
                  </g>
                )}
                {/* Apex dot on elevated signal cubes */}
                {isActive && elevProgress > 0.3 && (
                  <circle
                    cx={cx} cy={cy - totalElev - TH}
                    r={1.2}
                    fill="var(--text)"
                    opacity={elevProgress * 0.9}
                    filter="url(#fg2-glow-lg)"
                  />
                )}
              </g>
            );
          })}

        {/* ── Vertical guide lines from base to cube corners on signal cubes (ghosted) ── */}
        {CUBE_DEFS.filter(c => c.signal && elevProgress > 0.1).map((cube, i) => {
          const { cx, cy } = isoCenter(cube.r, cube.c);
          const baseElev   = cube.h * CUBE_H_UNIT;
          const extraLift  = elevProgress * 14;
          const totalElev  = baseElev + extraLift;
          return (
            <g key={`guide-${i}`} opacity={elevProgress * 0.18}>
              <line x1={cx - TW} y1={cy - baseElev} x2={cx - TW} y2={cy - totalElev} stroke="var(--text)" strokeWidth="0.4" strokeDasharray="2 3" />
              <line x1={cx + TW} y1={cy - baseElev} x2={cx + TW} y2={cy - totalElev} stroke="var(--text)" strokeWidth="0.4" strokeDasharray="2 3" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}