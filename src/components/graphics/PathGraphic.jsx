/**
 * PathGraphic — FIG 0.3 // ROI CALCULATOR / ROUTE ANALYSIS
 *
 * Isometric network of grey wireframe nodes + connectors.
 * A bright tracer beam follows the single optimal path.
 * Dead-end branches are dimmer. Final node pulses on arrival.
 * Theme-aware.
 */
import { useEffect, useRef, useState } from 'react';

// Node positions in isometric local space (before SVG iso-transform)
const NODES = [
  { id: 'S',   x: -85, y: 40,  role: 'start' },
  { id: 'A',   x: -55, y: 10,  role: 'path' },
  { id: 'B1',  x: -30, y: -20, role: 'path' },
  { id: 'B2',  x: -25, y: 30,  role: 'dead' },
  { id: 'C',   x: 5,   y: -45, role: 'path' },
  { id: 'D1',  x: 25,  y: 5,   role: 'dead' },
  { id: 'D2',  x: 40,  y: -70, role: 'path' },
  { id: 'E1',  x: 55,  y: -30, role: 'dead' },
  { id: 'D',   x: 75,  y: -90, role: 'end' },
];

// All edges
const EDGES = [
  ['S',  'A'],
  ['A',  'B1'],
  ['A',  'B2'],  // dead end branch
  ['B1', 'C'],
  ['B1', 'D1'],  // dead end branch
  ['C',  'D2'],
  ['C',  'E1'],  // dead end branch
  ['D2', 'D'],
];

// Optimal path (sequence of node IDs)
const PATH = ['S', 'A', 'B1', 'C', 'D2', 'D'];

function nodeById(id) { return NODES.find(n => n.id === id); }

// Interpolate between two nodes at t (0..1)
function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Get tracer position along PATH at progress p (0..1)
function tracerPos(p) {
  const totalSegs = PATH.length - 1;
  const seg = p * totalSegs;
  const i = Math.min(Math.floor(seg), totalSegs - 1);
  const t = seg - i;
  const a = nodeById(PATH[i]);
  const b = nodeById(PATH[i + 1]);
  return lerp(a, b, t);
}

// Which path nodes have been visited at progress p
function visitedNodes(p) {
  const totalSegs = PATH.length - 1;
  const seg = p * totalSegs;
  const visited = new Set();
  for (let i = 0; i <= Math.floor(seg); i++) visited.add(PATH[i]);
  return visited;
}

export default function PathGraphic({ isDark = true }) {
  const [tracerP, setTracerP] = useState(0); // 0..1 progress along path
  const [arrived, setArrived] = useState(false);
  const [destPulse, setDestPulse] = useState(0); // 0..1 dest pulse
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const EDGE_DIM  = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const EDGE_PATH = isDark ? 'rgba(255,255,255,0.6)'  : 'rgba(34,35,38,0.6)';
  const NODE_DIM  = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)';
  const NODE_PATH = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(34,35,38,0.85)';
  const NODE_END  = isDark ? '#ffffff' : '#222326';
  const TRACER    = isDark ? '#ffffff' : '#222326';
  const DEAD_NODE = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    const TRACE_DUR = 2800;   // ms to traverse path
    const HOLD_AT_END = 1200; // ms at destination
    const PULSE_DUR = 800;    // ms for final pulse
    const IDLE = 1000;        // ms before restarting

    let pulseStart = null;
    let arrivedFlag = false;

    function animate(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      if (!arrivedFlag) {
        const p = Math.min(elapsed / TRACE_DUR, 1);
        setTracerP(p);
        if (p >= 1) {
          arrivedFlag = true;
          setArrived(true);
          pulseStart = ts;
        }
      } else {
        // Pulse phase
        const sinceArrived = ts - pulseStart;
        const pulse = Math.min(sinceArrived / PULSE_DUR, 1);
        setDestPulse(pulse);

        if (sinceArrived > HOLD_AT_END + IDLE) {
          // Reset
          arrivedFlag = false;
          startRef.current = ts;
          setTracerP(0);
          setArrived(false);
          setDestPulse(0);
          pulseStart = null;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const pos = tracerPos(tracerP);
  const visited = visitedNodes(tracerP);
  const pathSet = new Set(PATH);

  // Is an edge on the optimal path?
  function isPathEdge(a, b) {
    for (let i = 0; i < PATH.length - 1; i++) {
      if ((PATH[i] === a && PATH[i + 1] === b) || (PATH[i] === b && PATH[i + 1] === a)) return true;
    }
    return false;
  }

  // Dest pulse ring
  const destNode = nodeById('D');
  const pulseR = destPulse * 18;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 220 210" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <filter id="pg-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="pg-glow-soft" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform="translate(80, 150) scale(1, 0.5) rotate(45)">

          {/* Edges */}
          {EDGES.map(([a, b]) => {
            const na = nodeById(a), nb = nodeById(b);
            const onPath = isPathEdge(a, b);
            const aVisited = visited.has(a);
            const bVisited = visited.has(b);
            const lit = onPath && aVisited;
            return (
              <line
                key={`${a}-${b}`}
                x1={na.x} y1={na.y}
                x2={nb.x} y2={nb.y}
                stroke={lit ? EDGE_PATH : onPath ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') : EDGE_DIM}
                strokeWidth={lit ? 1.5 : onPath ? 0.8 : 0.6}
                strokeDasharray={onPath ? undefined : '3 3'}
                filter={lit ? 'url(#pg-glow)' : undefined}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const isEnd = node.role === 'end';
            const isStart = node.role === 'start';
            const isDead = node.role === 'dead';
            const onPath = pathSet.has(node.id);
            const isVisited = visited.has(node.id);

            const r = isEnd ? 5 : isStart ? 4 : isDead ? 2 : 3;
            const fill = isDead
              ? DEAD_NODE
              : isEnd
              ? (arrived ? NODE_END : NODE_DIM)
              : (isVisited ? NODE_PATH : onPath ? NODE_DIM : DEAD_NODE);
            const glowFilter = (isEnd && arrived) || (onPath && isVisited) ? 'url(#pg-glow)' : undefined;

            return (
              <g key={node.id}>
                {/* Halo for path nodes */}
                {onPath && !isDead && (
                  <circle
                    cx={node.x} cy={node.y}
                    r={r + 4}
                    fill="none"
                    stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}
                    strokeWidth="0.6"
                  />
                )}
                <circle
                  cx={node.x} cy={node.y}
                  r={r}
                  fill={fill}
                  filter={glowFilter}
                />
              </g>
            );
          })}

          {/* Destination arrival pulse ring */}
          {arrived && pulseR > 0 && (
            <>
              <circle
                cx={destNode.x} cy={destNode.y}
                r={pulseR}
                fill="none"
                stroke={NODE_END}
                strokeWidth="1"
                opacity={Math.max(0, 1 - destPulse * 1.1)}
                filter="url(#pg-glow-soft)"
              />
              <circle
                cx={destNode.x} cy={destNode.y}
                r={pulseR * 0.5}
                fill="none"
                stroke={NODE_END}
                strokeWidth="0.7"
                opacity={Math.max(0, 1 - destPulse)}
              />
            </>
          )}

          {/* Tracer dot */}
          {!arrived && (
            <circle
              cx={pos.x} cy={pos.y}
              r={3.5}
              fill={TRACER}
              filter="url(#pg-glow)"
              opacity={0.9}
            />
          )}

        </g>
      </svg>
    </div>
  );
}
