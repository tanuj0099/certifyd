import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReactFlow, Background } from '@xyflow/react';
import { ArrowLeft, Map, FolderGit2, LineChart, ChevronDown, CheckCircle2 } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import TopCertsModule from '../components/ui/TopCertsModule';
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
    if (!nodeId) return;
    setCompletedNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((n) => n !== nodeId) : [...prev, nodeId]
    );
  };

  const nodeTypes = useMemo(() => ({ certifyRoiNode: RoadmapNode }), []);
  const meta = ROADMAP_INDEX.find((r) => r.id === id) || { title: id, description: '' };

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setNodes([]);
        setEdges([]);
        setError(null);
        const module = await import(
          `../data/certifyroi-master-files/certifyroi-${id}-master.json`
        );
        const { nodes: mappedNodes, edges: mappedEdges } = mapRoadmapDataToFlow(module.default);
        if (mappedNodes.length > 0) {
          const maxY = Math.max(...mappedNodes.map((n) => n.position.y));
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

  const nodesWithStatus = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      status: completedNodes.includes(n.id) ? 'done' : 'pending',
    },
  }));

  const progressPercentage =
    nodes.length > 0 ? Math.round((completedNodes.length / nodes.length) * 100) : 0;

  /* ── Error / loading states ── */
  if (error) {
    return (
      <div
        className="min-h-screen page-top-pad flex items-center justify-center px-4"
        style={{ background: 'var(--bg)' }}
      >
        <h2 className="text-xl font-bold text-center" style={{ color: 'var(--text)' }}>
          {error}
        </h2>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div
        className="min-h-screen page-top-pad flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--border-mid)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    /*
      ── Root wrapper ──────────────────────────────────────────────────
      BEFORE: bg-slate-50 — hardcoded light, breaks dark theme
      AFTER:  var(--bg) — follows theme system

      overflow-x-hidden: prevents ReactFlow or any child from causing
      horizontal scroll on mobile.

      page-top-pad: utility class from index.css that gives correct
      nav clearance (104px mobile / 112px desktop).
    */
    <div
      className="min-h-screen overflow-x-hidden page-top-pad"
      style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}
    >
      {/*
        ── Header section ────────────────────────────────────────────
        Mobile:  px-4  (16px sides)
        Tablet:  px-6  (24px)
        Desktop: px-8  (32px)
        max-w-4xl keeps content readable on wide screens
      */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 md:mb-10">

          {/* ── Back link — min-h-[44px] for touch target ── */}
          <Link
            to="/roadmaps"
            className="inline-flex items-center gap-2 text-sm font-bold mb-5 md:mb-6 transition-colors min-h-[44px]"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <ArrowLeft size={16} /> All Roadmaps
          </Link>

          {/*
            Title:
            BEFORE: text-4xl md:text-5xl — 36px on mobile wraps on 375px
            AFTER:  text-2xl md:text-4xl lg:text-5xl — smooth 3-step scale
          */}
          <h1
            className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight mb-3"
            style={{ color: 'var(--text)' }}
          >
            {meta.title}
          </h1>
          <p
            className="text-sm md:text-lg mb-6 md:mb-8 leading-relaxed"
            style={{ color: 'var(--text-3)' }}
          >
            {meta.description}
          </p>

          {/* ── Tab row ── */}
          {/*
            Tab buttons: min-h-[44px] ensures fat-finger safety.
            overflow-x-auto + no-scrollbar lets tabs scroll on very small screens.
          */}
          <div
            className="flex gap-4 md:gap-6 border-b mb-5 md:mb-6 overflow-x-auto"
            style={{ borderColor: 'var(--border)', scrollbarWidth: 'none' }}
          >
            {[
              { icon: Map, label: 'Roadmap', active: true },
              { icon: FolderGit2, label: 'Projects', active: false },
              { icon: LineChart, label: 'Offer Analysis', active: false },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className="flex items-center gap-2 text-sm font-bold pb-3 transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px]"
                style={{
                  color: active ? 'var(--text)' : 'var(--text-4)',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* ── Progress banner + accordion ── */}
          <div className="max-w-3xl">
            {/* Progress banner */}
            <div
              className="text-sm font-medium px-4 md:px-5 py-3 md:py-3.5 rounded-t-xl border flex justify-between items-center gap-3"
              style={{
                background: 'rgba(245,158,11,0.08)',
                borderColor: 'rgba(245,158,11,0.25)',
                color: 'var(--text-2)',
              }}
            >
              <span className="flex items-center gap-2 text-xs md:text-sm">
                <CheckCircle2 size={16} style={{ color: '#d97706' }} />
                Tracking progress across {nodes.length} skills
              </span>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                {/* Progress bar — hidden on very small screens to save space */}
                <div
                  className="hidden sm:block w-20 md:w-24 h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(245,158,11,0.2)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%`, background: '#d97706' }}
                  />
                </div>
                <span className="font-bold text-sm" style={{ color: '#d97706' }}>
                  {progressPercentage}%
                </span>
              </div>
            </div>

            {/* Accordion — "What is X?" */}
            {/*
              onClick area has min-h-[44px] implicitly via py-4 (32px) + content.
              The cursor:pointer and hover state make it clearly tappable.
            */}
            <div
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="border-x border-b rounded-b-xl px-4 md:px-5 py-3.5 md:py-4 cursor-pointer transition-colors"
              style={{
                background: 'var(--bg-alt)',
                borderColor: 'rgba(245,158,11,0.25)',
              }}
            >
              <div className="flex justify-between items-center gap-3">
                <span className="font-bold text-sm md:text-base" style={{ color: 'var(--text)' }}>
                  What is {meta.title} Development?
                </span>
                <ChevronDown
                  size={18}
                  className={`flex-shrink-0 transition-transform ${isAccordionOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-4)' }}
                />
              </div>
              {isAccordionOpen && (
                <div
                  className="mt-3 md:mt-4 text-sm leading-relaxed border-t pt-3 md:pt-4"
                  style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
                >
                  {meta.title} development involves building the core logic, databases, and
                  infrastructure that power modern software applications. You will learn how to
                  design scalable architectures, manage servers, and build secure APIs.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ReactFlow canvas ── */}
      {/*
        w-full + overflow-x-hidden on the root prevents horizontal scroll.
        The canvas itself is fixed-height based on the roadmap data.
      */}
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
          <Background color="var(--border)" gap={24} size={2} />
        </ReactFlow>
      </div>

      {/* ── Top certs module ── */}
      <div style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)' }}>
        <TopCertsModule roadmapId={id} />
      </div>

      {/* ── Node detail drawer ── */}
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
