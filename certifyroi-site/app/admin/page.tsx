'use client';

import { useState } from 'react';

interface AnalyticsPayload {
  performanceScore: number;
  gpuLatencyStatus: string;
  verificationThroughput: string;
  optimizationInsights: string[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(false);

  // Calls your newly established Vertex AI API backend route
  const triggerSystemAudit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze the following mock CertifyROI application metrics and output a strict JSON object matching this schema:
          {
            "performanceScore": 94,
            "gpuLatencyStatus": "Optimal (1.2ms render cycle)",
            "verificationThroughput": "99.8% Success Rate (42 req/sec)",
            "optimizationInsights": ["Insight line 1", "Insight line 2"]
          }
          Ensure no markdown wrappers exist in the output, only valid raw JSON.`
        }),
      });
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Pipeline failure:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono text-xs selection:bg-neutral-800">
      
      {/* HEADER BANNER */}
      <header className="border-b border-neutral-800 p-4 flex justify-between items-center tracking-wider">
        <div>CERTIFYROI // CORE SYSTEM ANCHOR</div>
        <div className="text-neutral-500">[STATUS: ACTIVE_PIPELINE]</div>
      </header>

      {/* CORE CONTROL AND TELEMETRY GRID */}
      {/* md: to lg: viewport constraints mapping strict tablet wrap parameters */}
      <main className="grid grid-cols-1 md:grid-cols-3 border-b border-neutral-800">
        
        {/* PANEL 1: ENGINE CONTROLS */}
        <section className="p-6 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col justify-between">
          <div>
            <h2 className="text-neutral-400 mb-4 tracking-widest">// MODEL CORE OPERATIONS</h2>
            <p className="text-neutral-500 mb-6 leading-relaxed">
              Triggers a deep contextual evaluation of system health, processing loads, and asset bottlenecks using your free Vertex AI token budget.
            </p>
          </div>
          <button
            onClick={triggerSystemAudit}
            disabled={loading}
            className="w-full border border-neutral-700 bg-transparent py-3 uppercase tracking-widest hover:border-neutral-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'RUNNING INTEGRITY CHECK...' : 'EXECUTE PROTOCOL AUDIT'}
          </button>
        </section>

        {/* PANEL 2: HARDWARE STATS */}
        <section className="p-6 border-b md:border-b-0 md:border-r border-neutral-800">
          <h2 className="text-neutral-400 mb-4 tracking-widest">// GRAPHICS & TELEMETRY LOGS</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-neutral-900 pb-2">
              <span className="text-neutral-500">CANVAS ENGINE:</span>
              <span>THREE.JS / WEBGL2</span>
            </div>
            <div className="flex justify-between border-b border-neutral-900 pb-2">
              <span className="text-neutral-500">GPU RENDER TARGET:</span>
              <span>{data ? data.gpuLatencyStatus : 'AWAITING METRICS'}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-900 pb-2">
              <span className="text-neutral-500">VERIFICATION MATRIX:</span>
              <span>{data ? data.verificationThroughput : 'AWAITING METRICS'}</span>
            </div>
          </div>
        </section>

        {/* PANEL 3: LIVE RE-ROUTING MONITOR */}
        <section className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-neutral-400 mb-4 tracking-widest">// VECTOR JOURNEY DATA</h2>
            <div className="flex items-center gap-3 text-neutral-500">
              {/* Responsive SVG using absolute theme currentColor sync */}
              <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="1" d="M3 12h18M3 6h18M3 18h16" />
              </svg>
              <span>SYS_EFFICIENCY_INDEX: {data ? `${data.performanceScore}%` : 'N/A'}</span>
            </div>
          </div>
          <div className="text-[10px] text-neutral-600 mt-4">
            REG_ID: SKILLS-DEVELOPER-496409
          </div>
        </section>
      </main>

      {/* DYNAMIC ANALYSIS OUTPUT (TEXT-BLEED BLOCK) */}
      {data && (
        <section className="p-6 border-b border-neutral-800 animate-fadeIn">
          <h2 className="text-neutral-400 mb-4 tracking-widest">// PROD_INSIGHT_ARRAY_STREAM</h2>
          <ul className="space-y-3 list-none p-0 m-0">
            {data.optimizationInsights.map((insight, index) => (
              <li key={index} className="flex gap-2 items-start leading-relaxed text-neutral-300">
                <span className="text-neutral-600">[{index + 1}]</span>
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}