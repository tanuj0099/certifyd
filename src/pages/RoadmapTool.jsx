import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReactFlow, Background } from '@xyflow/react';
import { ArrowLeft, Map, FolderGit2, LineChart, ChevronDown, CheckCircle2 } from 'lucide-react';
import '@xyflow/react/dist/style.css';

import RoadmapNode from '../components/ui/RoadmapNode';
import RoadmapDrawer from '../components/ui/RoadmapDrawer';
import { mapRoadmapDataToFlow } from '../utils/roadmapMapper';
import { ROADMAP_INDEX } from '../data/roadmapIndex';

export default function RoadmapTool() {
  const { id } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [graphHeight, setGraphHeight] = useState(1000);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const [completedNodes, setCompletedNodes] = useState(() => {
    const saved = localStorage.getItem(`certifyroi-progress-${id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`certifyroi-progress-${id}`, JSON.stringify(completedNodes));
  }, [completedNodes, id]);

  const toggleNodeCompletion = (nodeId) => {
    if (!nodeId) return; // Safety check
    setCompletedNodes(prev => 
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    );
  };

  const nodeTypes = useMemo(() => ({ certifyRoiNode: RoadmapNode }), []);
  const meta = ROADMAP_INDEX.find(r => r.id === id) || { title: id, description: "" };

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setNodes([]);
        setEdges([]);
        setError(null);
        const module = await import(`../data/certifyroi-master-files/certifyroi-${id}-master.json`);
        const { nodes: mappedNodes, edges: mappedEdges } = mapRoadmapDataToFlow(module.default);
        
        if (mappedNodes.length > 0) {
          const maxY = Math.max(...mappedNodes.map(n => n.position.y));
          setGraphHeight(maxY + 400);
        }
        setNodes(mappedNodes);
        setEdges(mappedEdges);
      } catch (err) {
        setError(`Could not find a roadmap for "${id}".`);
      }
    };
    if (id) loadRoadmap();
  }, [id]);

  const onInit = (instance) => {
    const screenCenter = window.innerWidth / 2;
    instance.setViewport({ x: screenCenter, y: 50, zoom: 1 });
  };

  const nodesWithStatus = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      status: completedNodes.includes(n.id) ? 'done' : 'pending'
    }
  }));

  const progressPercentage = nodes.length > 0 
    ? Math.round((completedNodes.length / nodes.length) * 100) 
    : 0;

  if (error) return <div className="min-h-screen pt-24 flex items-center justify-center bg-slate-50"><h2 className="text-2xl font-bold">{error}</h2></div>;
  if (nodes.length === 0) return <div className="min-h-screen pt-24 flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="mb-10">
          <Link to="/roadmaps" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> All Roadmaps
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">{meta.title}</h1>
          <p className="text-lg text-slate-600 mb-8">{meta.description}</p>
            
          {/* Tabs */}
          <div className="flex gap-6 md:gap-8 border-b border-slate-200 mb-6 px-2">
            <button className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-3">
              <Map size={16} /> Roadmap
            </button>
            <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 pb-3 transition-colors">
              <FolderGit2 size={16} /> Projects
            </button>
            <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 pb-3 transition-colors">
              <LineChart size={16} /> Offer Analysis
            </button>
          </div>

          {/* Yellow Progress Banner & Accordion (Roadmap.sh style) */}
          <div className="max-w-3xl">
            <div className="bg-amber-100/50 text-amber-900 text-sm font-medium px-5 py-3.5 rounded-t-xl border border-amber-200 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-amber-600" />
                Tracking progress across {nodes.length} skills
              </span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-amber-200/50 rounded-full overflow-hidden hidden md:block">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
                <span className="font-bold">{progressPercentage}%</span>
              </div>
            </div>
            
            <div 
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="bg-white border-x border-b border-amber-200 rounded-b-xl px-5 py-4 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">What is {meta.title} Development?</span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform ${isAccordionOpen ? 'rotate-180' : ''}`} />
              </div>
              {isAccordionOpen && (
                <div className="mt-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {meta.title} development involves building the core logic, databases, and infrastructure that power modern software applications. You will learn how to design scalable architectures, manage servers, and build secure APIs.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full relative" style={{ height: `${graphHeight}px` }}>
        <ReactFlow
          nodes={nodesWithStatus} 
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(e, node) => {
            setSelectedNode(node.data);
            setIsDrawerOpen(true);
          }}
          onInit={onInit}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          preventScrolling={false}
        >
          <Background color="#cbd5e1" gap={24} size={2} />
        </ReactFlow>
      </div>

      <RoadmapDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        nodeData={selectedNode}
        isCompleted={selectedNode ? completedNodes.includes(selectedNode.id) : false}
        onToggleComplete={toggleNodeCompletion}
      />
    </div>
  );
}