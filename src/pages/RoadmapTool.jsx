import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import RoadmapNode from '../components/ui/RoadmapNode';
import RoadmapDrawer from '../components/ui/RoadmapDrawer';
import { mapRoadmapDataToFlow } from '../utils/roadmapMapper';

export default function RoadmapTool() {
  const { id } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);

  const nodeTypes = useMemo(() => ({ certifyRoiNode: RoadmapNode }), []);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        // Reset state when URL changes
        setNodes([]);
        setEdges([]);
        setError(null);

        // Dynamically fetch the file
        const module = await import(`../data/certifyroi-master-files/certifyroi-${id}-master.json`);
        
        // Run the math engine
        const { nodes: mappedNodes, edges: mappedEdges } = mapRoadmapDataToFlow(module.default);
        
        // Set the state
        setNodes(mappedNodes);
        setEdges(mappedEdges);
      } catch (err) {
        console.error("Failed to load roadmap data:", err);
        setError(`Could not find a roadmap for "${id}".`);
      }
    };

    if (id) {
      loadRoadmap();
    }
  }, [id]);

  const onNodeClick = (event, node) => {
    setSelectedNode(node.data);
    setIsDrawerOpen(true);
  };

  // --- THE MAGIC FIX: THE RENDER BLOCKER ---
  // Do not let React Flow render its camera until the nodes actually exist!
  if (error) {
    return <div className="w-screen h-screen flex items-center justify-center text-red-500 font-bold">{error}</div>;
  }

  if (nodes.length === 0) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Calculating Roadmap Coordinates...</p>
      </div>
    );
  }

  // Once nodes exist, render the map with a strict absolute height to prevent collapsing
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, backgroundColor: '#f8fafc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1 }}
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls />
      </ReactFlow>

      <RoadmapDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        nodeData={selectedNode} 
      />
    </div>
  );
}