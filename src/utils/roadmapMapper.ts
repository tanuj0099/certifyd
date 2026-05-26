import { Node, Edge } from '@xyflow/react';

export interface MappedRoadmap {
  nodes: Node[];
  edges: Edge[];
}

export function mapRoadmapDataToFlow(rawJson: any): MappedRoadmap {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];

  const contentDict = rawJson.certifyroi_content || {};
  const rawNodes = Array.isArray(rawJson.nodes) ? rawJson.nodes : [];
  const rawEdges = Array.isArray(rawJson.edges) ? rawJson.edges : [];

  const nodeMap = new Map();
  rawNodes.forEach((n: any) => {
    const title = n.title || n.label || n.data?.title || n.data?.label || n.id;
    nodeMap.set(n.id, { id: n.id, title });
  });

  // 1. Build Strict Relationships
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();
  rawNodes.forEach(n => {
    childrenMap.set(n.id, []);
    parentMap.set(n.id, []);
  });

  const validIds = new Set(nodeMap.keys());
  rawEdges.forEach((e: any) => {
    const s = e.source || e.from;
    const t = e.target || e.to;
    if (validIds.has(s) && validIds.has(t)) {
      childrenMap.get(s)!.push(t);
      parentMap.get(t)!.push(s);
    }
  });

  // 2. The Critical Path Algorithm (Guarantees Logical Flow)
  const depthMemo = new Map<string, number>();
  function getDepth(nodeId: string): number {
    if (depthMemo.has(nodeId)) return depthMemo.get(nodeId)!;
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return 1;
    const maxChildDepth = Math.max(...children.map(getDepth));
    const depth = 1 + maxChildDepth;
    depthMemo.set(nodeId, depth);
    return depth;
  }

  // Find the absolute start of the roadmap
  const roots = Array.from(validIds).filter(id => parentMap.get(id)!.length === 0);
  roots.sort((a, b) => getDepth(b) - getDepth(a));
  
  // Trace the logical spine from start to finish
  const spinePath: string[] = [];
  let currentSpine = roots[0];
  while (currentSpine) {
    spinePath.push(currentSpine);
    const children = childrenMap.get(currentSpine) || [];
    if (children.length === 0) break;
    currentSpine = children.reduce((a, b) => getDepth(a) > getDepth(b) ? a : b);
  }
  const spineSet = new Set(spinePath);

  // 3. The Anti-Overlap Engine (Dynamic Y-Cursor)
  const layoutedNodes: Node[] = [];
  const placed = new Set<string>();
  
  const Y_STEP = 140; // Vertical distance between core nodes
  const Y_RIB_STEP = 90; // Vertical distance between stacked side-quests
  const X_OFFSET = 280; // Distance from center

  let currentY = 0;

  spinePath.forEach((spineId) => {
    // A. Place the Core Node
    placed.add(spineId);
    layoutedNodes.push({
      id: spineId,
      type: 'certifyRoiNode',
      position: { x: -120, y: currentY }, // Center (assuming ~240px width)
      data: {
        label: nodeMap.get(spineId).title,
        description: contentDict[spineId] || "",
        variant: 'checkpoint'
      }
    });

    // B. Find its side-quests (children not on the spine)
    const ribs = (childrenMap.get(spineId) || []).filter(c => !spineSet.has(c));
    
    let leftY = currentY + 80;
    let rightY = currentY + 80;

    ribs.forEach((ribId, index) => {
      if (placed.has(ribId)) return;
      placed.add(ribId);

      // Alternate left and right
      const isLeft = index % 2 === 0;
      const sideX = isLeft ? -(X_OFFSET + 100) : X_OFFSET;
      const sideY = isLeft ? leftY : rightY;

      layoutedNodes.push({
        id: ribId,
        type: 'certifyRoiNode',
        position: { x: sideX, y: sideY },
        data: {
          label: nodeMap.get(ribId).title,
          description: contentDict[ribId] || "",
          variant: 'standard',
          side: isLeft ? 'left' : 'right'
        }
      });

      // Draw horizontal edge from spine to rib
      flowEdges.push({
        id: `e-${spineId}-${ribId}`,
        source: spineId,
        target: ribId,
        type: 'smoothstep',
        sourceHandle: isLeft ? 'left' : 'right', // Connects logically out the sides
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '4,4' }
      });

      // Advance the Y cursor for that side so the next item stacks neatly below it
      if (isLeft) leftY += Y_RIB_STEP;
      else rightY += Y_RIB_STEP;
    });

    // Draw vertical edge to the NEXT spine node
    const nextSpineIndex = spinePath.indexOf(spineId) + 1;
    if (nextSpineIndex < spinePath.length) {
      const nextSpineId = spinePath[nextSpineIndex];
      flowEdges.push({
        id: `e-${spineId}-${nextSpineId}`,
        source: spineId,
        target: nextSpineId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#0f172a', strokeWidth: 3 } // Thick solid line for the main path
      });
    }

    // C. The Overlap Blocker: Wait for the longest side-quest chain to finish before dropping the next core node
    currentY = Math.max(currentY + Y_STEP, leftY + 40, rightY + 40);
  });

  return { nodes: layoutedNodes, edges: flowEdges };
}