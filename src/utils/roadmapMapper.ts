import { Node, Edge } from '@xyflow/react';

export interface MappedRoadmap {
  nodes: Node[];
  edges: Edge[];
}

export function mapRoadmapDataToFlow(rawJson: any): MappedRoadmap {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];

  const contentDict = rawJson.certifyd_content || {};
  const rawNodes = Array.isArray(rawJson.nodes) ? rawJson.nodes : [];
  let rawEdges = Array.isArray(rawJson.edges) ? rawJson.edges : [];

  // --- 1. TITLE EXTRACTION & GIBBERISH FILTER ---
  const nodeMap = new Map();
  rawNodes.forEach((n: any) => {
    const rawTitle = n.title || n.label || n.name || n.text || n.data?.title || n.data?.label || n.form?.title || n.id;
    const isGibberishHash = /^[a-zA-Z0-9_-]{15,}$/.test(rawTitle);
    nodeMap.set(n.id, { id: n.id, title: isGibberishHash ? "Specialized Skill" : rawTitle });
  });

  // --- 2. JUNK EXCISOR ---
  const JUNK_PHRASES = ["have a look at the following", "how to use this", "disclaimer", "keep learning"];
  const junkIds = new Set<string>();
  
  nodeMap.forEach((node, id) => {
    if (JUNK_PHRASES.some(phrase => node.title.toLowerCase().includes(phrase))) {
      junkIds.add(id);
      nodeMap.delete(id);
    }
  });

  const parentsOfJunk = new Map<string, string[]>();
  const childrenOfJunk = new Map<string, string[]>();

  rawEdges.forEach((e: any) => {
    const s = e.source || e.from;
    const t = e.target || e.to;
    if (junkIds.has(t)) { if (!parentsOfJunk.has(t)) parentsOfJunk.set(t, []); parentsOfJunk.get(t)!.push(s); }
    if (junkIds.has(s)) { if (!childrenOfJunk.has(s)) childrenOfJunk.set(s, []); childrenOfJunk.get(s)!.push(t); }
  });

  junkIds.forEach(jId => {
    const parents = parentsOfJunk.get(jId) || [];
    const children = childrenOfJunk.get(jId) || [];
    parents.forEach(p => children.forEach(c => {
      if (!junkIds.has(p) && !junkIds.has(c)) rawEdges.push({ source: p, target: c, id: `bridge-${p}-${c}` });
    }));
  });

  rawEdges = rawEdges.filter((e: any) => !junkIds.has(e.source || e.from) && !junkIds.has(e.target || e.to));
  const validIds = new Set(nodeMap.keys());

  // --- 3. GRAPH RELATIONSHIPS ---
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();
  validIds.forEach(id => { childrenMap.set(id, []); parentMap.set(id, []); });

  rawEdges.forEach((e: any) => {
    const s = e.source || e.from;
    const t = e.target || e.to;
    if (validIds.has(s) && validIds.has(t)) {
      childrenMap.get(s)!.push(t);
      parentMap.get(t)!.push(s);
    }
  });

  // --- 4. CRITICAL PATH (THE SPINE) ---
  const depthMemo = new Map<string, number>();
  function getDepth(nodeId: string): number {
    if (depthMemo.has(nodeId)) return depthMemo.get(nodeId)!;
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return 1;
    const depth = 1 + Math.max(...children.map(getDepth));
    depthMemo.set(nodeId, depth);
    return depth;
  }

  const roots = Array.from(validIds).filter(id => parentMap.get(id)!.length === 0);
  roots.sort((a, b) => getDepth(b) - getDepth(a));
  
  const spinePath: string[] = [];
  let currentSpine = roots[0];
  while (currentSpine) {
    spinePath.push(currentSpine);
    const children = childrenMap.get(currentSpine) || [];
    if (children.length === 0) break;
    currentSpine = children.reduce((a, b) => getDepth(a) > getDepth(b) ? a : b);
  }

  // Assign every non-spine node to its closest spine parent
  const nodeToSpine = new Map<string, string>();
  spinePath.forEach(id => nodeToSpine.set(id, id));
  const queue = [...spinePath];
  while(queue.length > 0) {
    const curr = queue.shift()!;
    const assignedSpine = nodeToSpine.get(curr)!;
    (childrenMap.get(curr) || []).forEach(child => {
      if (!nodeToSpine.has(child)) {
        nodeToSpine.set(child, assignedSpine);
        queue.push(child);
      }
    });
  }

  // --- 5. THE VERTICAL STACK RENDERER (Clean grouping) ---
  const layoutedNodes: Node[] = [];
  const nodeSideMap = new Map<string, string>();
  
  const Y_STEP = 160; 
  const Y_RIB_STEP = 65; // Tightly stacked vertically
  let currentY = 0;

  spinePath.forEach((spineId, index) => {
    // Center the core node (assuming ~240px width, so X: -120)
    layoutedNodes.push({
      id: spineId,
      type: 'certifyRoiNode',
      position: { x: -120, y: currentY }, 
      data: { id: spineId, label: nodeMap.get(spineId).title, description: contentDict[spineId] || "", variant: 'checkpoint' }
    });
    nodeSideMap.set(spineId, 'center');

    const cluster = Array.from(validIds).filter(id => id !== spineId && nodeToSpine.get(id) === spineId);
    cluster.sort((a, b) => getDepth(a) - getDepth(b));

    // Entire cluster goes to ONE side, alternating each step down the spine
    const side = index % 2 === 0 ? 'right' : 'left';
    const sideX = side === 'left' ? -380 : 200; 
    let ribY = currentY; 

    cluster.forEach((ribId) => {
      layoutedNodes.push({
        id: ribId,
        type: 'certifyRoiNode',
        position: { x: sideX, y: ribY },
        data: { id: ribId, label: nodeMap.get(ribId).title, description: contentDict[ribId] || "", variant: 'standard' }
      });
      nodeSideMap.set(ribId, side);
      ribY += Y_RIB_STEP; 
    });

    // Advance Y enough to clear either the spine step or the tall stack of side-skills
    currentY = Math.max(currentY + Y_STEP, ribY + 40);
  });

  // --- 6. SMART EDGE ROUTING (The Spaghetti Filter) ---
  rawEdges.forEach((e: any) => {
    const s = e.source || e.from;
    const t = e.target || e.to;
    
    if (validIds.has(s) && validIds.has(t)) {
      const sSide = nodeSideMap.get(s);
      const tSide = nodeSideMap.get(t);
      const isCore = sSide === 'center' && tSide === 'center';

      // 🛑 SPAGHETTI FILTER: Kill edges that ruin the layout
      if (sSide === 'left' && tSide === 'right') return; // No crossing the screen
      if (sSide === 'right' && tSide === 'left') return;
      if (sSide !== 'center' && tSide === 'center') return; // No backward lines up the tree
      if (!isCore && nodeToSpine.get(s) !== nodeToSpine.get(t)) return; // Don't jump clusters

      // Assign the invisible handles based strictly on physical location
      let sHandle = 's-bottom';
      let tHandle = 't-top';

      if (sSide === 'center' && tSide === 'right') { sHandle = 's-right'; tHandle = 't-left'; }
      else if (sSide === 'center' && tSide === 'left') { sHandle = 's-left'; tHandle = 't-right'; }
      else if (sSide === 'right' && tSide === 'right') { sHandle = 's-bottom'; tHandle = 't-top'; }
      else if (sSide === 'left' && tSide === 'left') { sHandle = 's-bottom'; tHandle = 't-top'; }

      flowEdges.push({
        id: e.id || `e-${s}-${t}`,
        source: s,
        target: t,
        type: 'smoothstep', // smoothstep rounds the corners automatically
        sourceHandle: sHandle,
        targetHandle: tHandle,
        animated: true,
        style: { 
          stroke: isCore ? '#0f172a' : '#94a3b8', 
          strokeWidth: isCore ? 3 : 2, 
          strokeDasharray: isCore ? 'none' : '5,5' 
        }
      });
    }
  });

  return { nodes: layoutedNodes, edges: flowEdges };
}