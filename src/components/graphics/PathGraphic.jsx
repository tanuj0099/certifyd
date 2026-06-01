/**
 * PathGraphic - FIG 0.3 // THE PATH
 *
 * Linear-style isometric wireframe network.
 * Crisp node circles + connector lines on an iso plane.
 * A bright tracer dot races the single optimal path - dead-end branches stay dim.
 * Final destination node pulses with a slow-expanding ring on arrival.
 * Pure wireframe - no fills, ultra-thin strokes, monochrome.
 */
import { useEffect, useRef, useState } from 'react';

//  Node layout in iso-local space 
// Deliberately spread across the iso plane for a balanced composition
const NODES = [
  { id: 'S',  x: -85, y:  35,  role: 'start' },
  { id: 'A',  x: -52, y:   2,  role: 'path'  },
  { id: 'B',  x: -24, y: -22,  role: 'path'  },
  { id: 'X1', x: -28, y:  26,  role: 'dead'  },
  { id: 'C',  x:   8, y: -48,  role: 'path'  },
  { id: 'X2', x:  14, y:   4,  role: 'dead'  },
  { id: 'X3', x: -46, y: -50,  role: 'dead'  },
  { id: 'D',  x:  40, y: -70,  role: 'path'  },
  { id: 'X4', x:  44, y: -28,  role: 'dead'  },
  { id: 'X5', x:  64, y: -46,  role: 'dead'  },
  { id: 'E',  x:  82, y: -88,  role: 'end'   },
];

//  All edges 
const EDGES = [
  ['S',  'A'],
  ['A',  'B'],
  ['A',  'X1'],   // dead end
  ['A',  'X3'],   // dead end
  ['B',  'C'],
  ['B',  'X2'],   // dead end
  ['C',  'D'],
  ['C',  'X4'],   // dead end
  ['D',  'E'],
  ['D',  'X5'],   // dead end
];

//  Optimal path 
const PATH = ['S', 'A', 'B', 'C', 'D', 'E'];

//  Helpers 
function nodeById(id) { return NODES.find(n => n.id === id); }

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function tracerPos(p) {
  const segs = PATH.length - 1;
  const s    = p * segs;
  const i    = Math.min(Math.floor(s), segs - 1);
  const a    = nodeById(PATH[i]);
  const b    = nodeById(PATH[i + 1]);
  return lerp(a, b, s - i);
}

function visitedSet(p) {
  const segs = PATH.length - 1;
  const s    = p * segs;
  const set  = new Set();
  for (let i = 0; i <= Math.floor(s); i++) set.add(PATH[i]);
  return set;
}

function isPathEdge(a, b) {
  for (let i = 0; i < PATH.length - 1; i++) {
    if ((PATH[i] === a && PATH[i+1] === b) ||
        (PATH[i] === b && PATH[i+1] === a)) return true;
  }
  return false;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}

const PATH_SET = new Set(PATH);

//  Component 
export default function PathGraphic() {
  const [tracerP,    setTracerP]    = useState(0);
  const [arrived,    setArrived]    = useState(false);
  const [pulseT,     setPulseT]     = useState(0);   // 0..1 arrival pulse
  const [trailPts,   setTrailPts]   = useState([]);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const TRACE_DUR  = 3200;  // ms
    const PULSE_DUR  = 1200;  // ms
    const HOLD       = 1400;  // ms at destination
    const IDLE       = 800;   // ms before restart
    let phase     = 'tracing';
    let phaseStart = null;
    let arrivedFlag = false;

    function tick(ts) {
      if (!phaseStart) phaseStart = ts;
      const el = ts - phaseStart;

      if (phase === 'tracing') {
        const raw = Math.min(el / TRACE_DUR, 1);
        const t   = easeInOutCubic(raw);
        setTracerP(t);

        // Trail: last 8 positions
        const trail = [];
        for (let i = 8; i >= 0; i--) {
          const tt = Math.max(0, raw - i * 0.015);
          trail.push(tracerPos(easeInOutCubic(tt)));
        }
        setTrailPts(trail);

        if (raw >= 1) {
          phase = 'arrived';
          phaseStart = ts;
          setArrived(true);
        }
      } else if (phase === 'arrived') {
        const t = Math.min(el / PULSE_DUR, 1);
        setPulseT(t);
        if (el > HOLD) {
          phase = 'idle';
          phaseStart = ts;
        }
      } else if (phase === 'idle') {
        if (el > IDLE) {
          phase = 'tracing';
          phaseStart = ts;
          setTracerP(0);
          setArrived(false);
          setPulseT(0);
          setTrailPts([]);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const pos     = tracerPos(tracerP);
  const visited = visitedSet(tracerP);
  const destNode = nodeById('E');
  const pulseR   = pulseT * 22;
  const pulseOp  = Math.max(0, (1 - pulseT) * 0.85);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 220 210" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <filter id="pg2-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="pg2-glow-sm" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="pg2-glow-lg" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/*  Iso transform - same as other graphics for visual consistency  */}
        <g transform="translate(78, 152) scale(1, 0.5) rotate(45)">

          {/*  Edges  */}
          {EDGES.map(([a, b]) => {
            const na = nodeById(a);
            const nb = nodeById(b);
            const onPath  = isPathEdge(a, b);
            const aVis    = visited.has(a);
            const lit     = onPath && aVis;
            const isDead  = !onPath;

            return (
              <g key={`${a}-${b}`}>
                {/* Glow layer for lit edges */}
                {lit && (
                  <line
                    x1={na.x} y1={na.y}
                    x2={nb.x} y2={nb.y}
                    stroke="var(--text)"
                    strokeWidth="3"
                    opacity="0.08"
                    strokeLinecap="round"
                    filter="url(#pg2-glow)"
                  />
                )}
                {/* Main edge */}
                <line
                  x1={na.x} y1={na.y}
                  x2={nb.x} y2={nb.y}
                  stroke={lit ? 'var(--text)' : isDead ? 'var(--border)' : 'var(--border-mid)'}
                  strokeWidth={lit ? 1.2 : isDead ? 0.5 : 0.7}
                  strokeDasharray={isDead ? '3 4' : undefined}
                  strokeLinecap="round"
                  opacity={lit ? 1 : isDead ? 0.4 : 0.55}
                  filter={lit ? 'url(#pg2-glow-sm)' : undefined}
                />
              </g>
            );
          })}

          {/*  Nodes  */}
          {NODES.map(node => {
            const isEnd   = node.role === 'end';
            const isStart = node.role === 'start';
            const isDead  = node.role === 'dead';
            const onPath  = PATH_SET.has(node.id);
            const isVis   = visited.has(node.id);
            const isArr   = isEnd && arrived;

            // Node size
            const r = isEnd ? 5 : isStart ? 4.5 : isDead ? 1.8 : 3;

            // Stroke brightness
            const strokeOp = isDead ? 0.25
              : isArr       ? 1
              : isVis       ? 0.95
              : onPath      ? 0.45
              : 0.3;

            const stroke = isDead
              ? 'var(--border)'
              : (isVis || isArr)
              ? 'var(--text)'
              : 'var(--border-mid)';

            return (
              <g key={node.id}>
                {/* Double ring for path nodes */}
                {onPath && !isDead && (
                  <circle
                    cx={node.x} cy={node.y}
                    r={r + 3.5}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="0.5"
                    opacity={isVis ? 0.4 : 0.2}
                  />
                )}
                {/* Main node circle */}
                <circle
                  cx={node.x} cy={node.y}
                  r={r}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isEnd || isStart ? 0.9 : 0.7}
                  opacity={strokeOp}
                  filter={(isVis || isArr) && !isDead ? 'url(#pg2-glow-sm)' : undefined}
                />
                {/* Inner fill dot for visited/arrived */}
                {(isVis || isArr) && !isDead && (
                  <circle
                    cx={node.x} cy={node.y}
                    r={r * 0.38}
                    fill="var(--text)"
                    opacity={isArr ? 0.9 : 0.6}
                  />
                )}
                {/* Start node marker - small square inside circle */}
                {isStart && (
                  <rect
                    x={node.x - 1.5} y={node.y - 1.5}
                    width={3} height={3}
                    fill="var(--text)"
                    opacity="0.5"
                  />
                )}
              </g>
            );
          })}

          {/*  Destination arrival pulse rings  */}
          {arrived && pulseR > 0 && (
            <>
              <circle
                cx={destNode.x} cy={destNode.y}
                r={pulseR}
                fill="none"
                stroke="var(--text)"
                strokeWidth="0.8"
                opacity={pulseOp}
                filter="url(#pg2-glow-lg)"
              />
              <circle
                cx={destNode.x} cy={destNode.y}
                r={pulseR * 0.6}
                fill="none"
                stroke="var(--text)"
                strokeWidth="0.5"
                opacity={pulseOp * 0.65}
              />
              <circle
                cx={destNode.x} cy={destNode.y}
                r={pulseR * 0.28}
                fill="none"
                stroke="var(--text)"
                strokeWidth="0.4"
                opacity={pulseOp * 0.4}
              />
            </>
          )}

          {/*  Tracer trail  */}
          {!arrived && trailPts.length > 1 && trailPts.map((p, i) => (
            i < trailPts.length - 1 && (
              <line
                key={i}
                x1={trailPts[i].x}   y1={trailPts[i].y}
                x2={trailPts[i+1].x} y2={trailPts[i+1].y}
                stroke="var(--text)"
                strokeWidth={0.5}
                opacity={(i / trailPts.length) * 0.3}
                strokeLinecap="round"
              />
            )
          ))}

          {/*  Tracer dot  */}
          {!arrived && (
            <>
              {/* Outer halo */}
              <circle
                cx={pos.x} cy={pos.y}
                r={5.5}
                fill="none"
                stroke="var(--text)"
                strokeWidth="0.5"
                opacity="0.18"
                filter="url(#pg2-glow)"
              />
              {/* Core */}
              <circle
                cx={pos.x} cy={pos.y}
                r={2.8}
                fill="var(--text)"
                opacity="0.95"
                filter="url(#pg2-glow)"
              />
            </>
          )}

          {/*  Path label: subtle "OPTIMAL" text along the route  */}
          {/* Shown as a faint dotted midpoint connector label */}
          {visited.size >= 3 && (
            <g opacity="0.2">
              <line
                x1={nodeById('A').x} y1={nodeById('A').y}
                x2={nodeById('D').x} y2={nodeById('D').y}
                stroke="var(--text)"
                strokeWidth="0.35"
                strokeDasharray="1.5 5"
              />
            </g>
          )}

        </g>
      </svg>
    </div>
  );
}