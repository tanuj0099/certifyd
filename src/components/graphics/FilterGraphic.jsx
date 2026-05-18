/**
 * FilterGraphic — FIG 0.1 // MARKET PULSE
 *
 * 8x8 isometric wireframe cube grid.
 * A glowing scanner plane sweeps across periodically.
 * 3–4 "signal" cubes transform: elevate dramatically + glow vividly.
 * Theme-aware: works on both dark (#222326) and light (#FFFFFF) backgrounds.
 */
import { useEffect, useRef, useState } from 'react';

// Isometric projection constants
const TW = 14;  // tile half-width
const TH = 7;   // tile half-height (TW * 0.5)
const ROWS = 8;
const COLS = 8;

// Grid origin — centred in 220×220 viewBox
const OX = 110;
const OY = 52;

// Signal cells (row, col)
const SIGNALS = [
  [2, 3], [2, 4], [3, 3], [4, 5],
];

function isoPoint(row, col) {
  const cx = OX + (col - row) * TW;
  const cy = OY + (col + row) * TH;
  return { cx, cy };
}

function topFacePoints(cx, cy, elev = 0) {
  const ey = cy - elev;
  return [
    `${cx},${ey - TH}`,
    `${cx + TW},${ey}`,
    `${cx},${ey + TH}`,
    `${cx - TW},${ey}`,
  ].join(' ');
}

function leftFacePoints(cx, cy, elev) {
  if (elev <= 0) return '';
  return [
    `${cx - TW},${cy}`,
    `${cx},${cy + TH}`,
    `${cx},${cy - elev + TH}`,
    `${cx - TW},${cy - elev}`,
  ].join(' ');
}

function rightFacePoints(cx, cy, elev) {
  if (elev <= 0) return '';
  return [
    `${cx},${cy + TH}`,
    `${cx + TW},${cy}`,
    `${cx + TW},${cy - elev}`,
    `${cx},${cy - elev + TH}`,
  ].join(' ');
}

// Build the sorted draw-order grid (painter's algorithm)
function buildGrid() {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const isSignal = SIGNALS.some(([sr, sc]) => sr === r && sc === c);
      cells.push({ r, c, depth: r + c, isSignal });
    }
  }
  cells.sort((a, b) => a.depth - b.depth || a.r - b.r);
  return cells;
}

const GRID = buildGrid();

export default function FilterGraphic({ isDark = true }) {
  const [scanX, setScanX] = useState(-1);         // scanner iso-X progress (0..1)
  const [elevated, setElevated] = useState(false); // signals elevated?
  const [elevProgress, setElevProgress] = useState(0); // 0..1 spring
  const rafRef = useRef(null);
  const phaseRef = useRef('idle'); // 'idle' | 'scanning' | 'elevated' | 'resetting'
  const timerRef = useRef(null);
  const elevRef = useRef(0);

  const STROKE = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
  const SIGNAL_STROKE = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,30,0.9)';
  const SCANNER_COLOR = isDark ? '#ffffff' : '#222326';
  const SIGNAL_GLOW = isDark ? '#ffffff' : '#222326';
  const FACE_FILL_L = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const FACE_FILL_R = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

  // Scanner sweeps left-to-right in iso space, then signals pop up
  useEffect(() => {
    let scanStart = null;
    const SCAN_DURATION = 1600; // ms
    const ELEV_HOLD = 2200;     // ms signals stay elevated
    const RESET_DURATION = 700; // ms
    const IDLE_BETWEEN = 1800;  // ms between loops

    function runScan(ts) {
      if (!scanStart) scanStart = ts;
      const t = Math.min((ts - scanStart) / SCAN_DURATION, 1);
      setScanX(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(runScan);
      } else {
        // Done scanning — elevate signals
        phaseRef.current = 'elevated';
        setElevated(true);
        setScanX(-1);
        // After ELEV_HOLD, start resetting
        timerRef.current = setTimeout(() => {
          phaseRef.current = 'resetting';
          setElevated(false);
          timerRef.current = setTimeout(() => {
            phaseRef.current = 'idle';
            timerRef.current = setTimeout(startLoop, IDLE_BETWEEN);
          }, RESET_DURATION);
        }, ELEV_HOLD);
      }
    }

    function startLoop() {
      scanStart = null;
      phaseRef.current = 'scanning';
      rafRef.current = requestAnimationFrame(runScan);
    }

    // Initial delay
    timerRef.current = setTimeout(startLoop, 800);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Spring-animate elevation value
  useEffect(() => {
    let raf;
    const target = elevated ? 1 : 0;
    function animate() {
      elevRef.current += (target - elevRef.current) * 0.14;
      setElevProgress(elevRef.current);
      if (Math.abs(target - elevRef.current) > 0.002) {
        raf = requestAnimationFrame(animate);
      } else {
        elevRef.current = target;
        setElevProgress(target);
      }
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [elevated]);

  // Compute scanner iso-column position
  const scannerCol = scanX >= 0 ? scanX * (COLS + ROWS) - ROWS : -999;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 220 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <filter id="fg-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="fg-glow-soft" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {GRID.map(({ r, c, isSignal }) => {
          const { cx, cy } = isoPoint(r, c);
          const maxElev = 28;
          const elev = isSignal ? elevProgress * maxElev : 0;
          const active = isSignal && elevProgress > 0.1;

          // Is this cell currently under the scanner?
          const colDepth = c - r; // iso column depth
          const underScanner = Math.abs(colDepth - (scannerCol - COLS / 2 + 0.5)) < 1.1 && scanX >= 0;

          const topFill = active
            ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(30,30,30,0.14)')
            : underScanner
            ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
            : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)');
          const strokeC = active ? SIGNAL_STROKE : underScanner ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') : STROKE;
          const sWidth = active ? 1 : underScanner ? 0.8 : 0.5;

          return (
            <g key={`${r}-${c}`} style={{ transition: 'none' }}>
              {/* Right face */}
              {elev > 0.5 && (
                <polygon
                  points={rightFacePoints(cx, cy, elev)}
                  fill={FACE_FILL_R}
                  stroke={strokeC}
                  strokeWidth={sWidth}
                  strokeLinejoin="round"
                />
              )}
              {/* Left face */}
              {elev > 0.5 && (
                <polygon
                  points={leftFacePoints(cx, cy, elev)}
                  fill={FACE_FILL_L}
                  stroke={strokeC}
                  strokeWidth={sWidth}
                  strokeLinejoin="round"
                />
              )}
              {/* Top face */}
              <polygon
                points={topFacePoints(cx, cy, elev)}
                fill={topFill}
                stroke={strokeC}
                strokeWidth={sWidth}
                strokeLinejoin="round"
                filter={active ? 'url(#fg-glow)' : undefined}
              />
              {/* Glow dot on elevated cubes */}
              {active && elev > 4 && (
                <circle
                  cx={cx}
                  cy={cy - elev - TH}
                  r={1.8 * elevProgress}
                  fill={SIGNAL_GLOW}
                  opacity={elevProgress * 0.9}
                  filter="url(#fg-glow-soft)"
                />
              )}
            </g>
          );
        })}

        {/* Scanner plane — glowing vertical iso-diagonal */}
        {scanX >= 0 && (() => {
          const isoCol = scannerCol;
          // Draw a diagonal line across the grid at this iso-column
          const x1 = OX + (isoCol - 0) * TW;
          const y1 = OY + (isoCol + 0) * TH - TH;
          const lineLen = ROWS;
          const x2 = OX + (isoCol - lineLen) * TW;
          const y2 = OY + (isoCol + lineLen) * TH - TH;
          const opacity = Math.sin(scanX * Math.PI) * 0.9;
          return (
            <g opacity={opacity}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={SCANNER_COLOR}
                strokeWidth="1"
                strokeLinecap="round"
                filter="url(#fg-glow-soft)"
              />
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={SCANNER_COLOR}
                strokeWidth="0.4"
                strokeLinecap="round"
                opacity="0.6"
              />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
