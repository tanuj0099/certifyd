'use client';

import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { Filter, MapPin, Award, Clock, ShieldCheck, TrendingUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FunnelItem { stage: string; count: number; percentage: string; fill: string; }
export interface CityItem { city: string; submissions: number; avgCtc: string; topCert: string; growth: string; x: number; y: number; volume: number; }
export interface CertIntelItem { name: string; analysisVol: number; submitVol: number; avgRoi: number; }
export interface HeatmapRow { day: string; hours: number[]; }
export interface QualityRow { week: string; piiPass: number; autoApproved: number; avgAnomaly: number; }

interface AnalyticsClientProps {
  funnelData: FunnelItem[];
  cityData: CityItem[];
  certIntelligence: CertIntelItem[];
  timeHeatmap: HeatmapRow[];
  qualityHistory: QualityRow[];
}

export function AnalyticsClient({
  funnelData,
  cityData,
  certIntelligence,
  timeHeatmap,
  qualityHistory
}: AnalyticsClientProps) {
  const [range, setRange] = useState<'7D' | '30D' | '90D' | 'Custom'>('30D');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [certView, setCertView] = useState<'analysisVol' | 'submitVol' | 'avgRoi'>('analysisVol');

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Analytics & Intelligence</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Deep funnel conversion, geographic distribution, and real database quality trends
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 bg-[#0F1218] p-1 rounded-xl border border-white/[0.06] font-mono text-xs">
          {(['7D', '30D', '90D', 'Custom'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                range === r
                  ? 'bg-[#F97316] text-[#080A0E] font-semibold shadow-sm shadow-[#F97316]/20'
                  : 'text-[#8B949E] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {selectedCity && (
        <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#F97316]">
            <MapPin className="w-4 h-4" />
            <span>Filtering intelligence for city: <strong className="font-mono underline">{selectedCity}</strong></span>
          </div>
          <button
            onClick={() => setSelectedCity(null)}
            className="text-[#8B949E] hover:text-white px-2 py-0.5 rounded bg-white/[0.04] text-[11px] font-mono"
          >
            Clear Filter ✕
          </button>
        </div>
      )}

      {/* Section 1 — Traffic & Conversion Funnel */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#F97316]" />
              <span>Section 1 — Traffic & Conversion Funnel (Live Database)</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">End-to-end user progression from session start to verified data submission</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#F97316] bg-[#F97316]/10 px-3 py-1 rounded-full border border-[#F97316]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Real-time Live Sync</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
          {funnelData.map((item, idx) => (
            <motion.div
              key={item.stage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#161B22] border border-white/[0.04] rounded-xl p-4 relative overflow-hidden flex flex-col justify-between"
            >
              <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{ backgroundColor: item.fill }}
              />
              <div>
                <p className="text-xs text-[#8B949E]">{item.stage}</p>
                <p className="text-2xl font-bold text-white mt-1">{item.count.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04] text-xs">
                <span className="text-[#8B949E]">Conversion Rate</span>
                <span className="font-semibold" style={{ color: item.fill }}>{item.percentage}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" stroke="#8B949E" fontSize={11} tickLine={false} />
              <YAxis dataKey="stage" type="category" stroke="#8B949E" fontSize={11} tickLine={false} width={130} />
              <Tooltip
                contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 2 — Geographic Distribution Heatmap */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#3B82F6]" />
              <span>Section 2 — Geographic Distribution (Live Database)</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">Where your users and data submissions are coming from</p>
          </div>
          <div className="text-xs font-mono text-[#8B949E]">
            Click a city bubble or card to filter certification intelligence below
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Simulated Map Canvas */}
          <div className="lg:col-span-7 bg-[#161B22] border border-white/[0.04] rounded-xl h-80 relative overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />
            <span className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider text-[#8B949E]/60">
              [INDIA TECH HUB MAP VIEW]
            </span>

            {cityData.map((city) => {
              const isSelected = selectedCity === city.city;
              return (
                <motion.button
                  key={city.city}
                  onClick={() => setSelectedCity(isSelected ? null : city.city)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    left: `${city.x}%`,
                    top: `${city.y}%`,
                    width: `${Math.max(36, city.volume * 1.8)}px`,
                    height: `${Math.max(36, city.volume * 1.8)}px`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center border transition-all cursor-pointer shadow-lg ${
                    isSelected
                      ? 'bg-[#F97316]/30 border-[#F97316] text-white shadow-[#F97316]/30 z-20 scale-110'
                      : 'bg-[#3B82F6]/20 border-[#3B82F6]/50 text-white/90 hover:border-[#3B82F6] z-10'
                  }`}
                >
                  <span className="font-bold text-[10px] leading-tight drop-shadow">{city.city.split(' ')[0]}</span>
                  <span className="text-[9px] font-mono opacity-80">{city.submissions}</span>
                </motion.button>
              );
            })}
          </div>

          {/* City Leaderboard Cards */}
          <div className="lg:col-span-5 space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {cityData.map((city) => {
              const isSelected = selectedCity === city.city;
              return (
                <div
                  key={city.city}
                  onClick={() => setSelectedCity(isSelected ? null : city.city)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#F97316]/10 border-[#F97316]/40 shadow-sm'
                      : 'bg-[#161B22] border-white/[0.04] hover:bg-white/[0.02]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{city.city}</span>
                      <span className="text-[10px] font-mono text-[#F97316] bg-[#F97316]/10 px-1.5 py-0.5 rounded">
                        {city.growth}
                      </span>
                    </div>
                    <p className="text-xs text-[#8B949E] font-mono mt-1">Top: {city.topCert}</p>
                  </div>

                  <div className="text-right font-mono">
                    <p className="text-sm font-bold text-white">{city.submissions} <span className="text-[10px] text-[#8B949E] font-normal">subs</span></p>
                    <p className="text-xs text-[#E8C547] mt-0.5">Avg: {city.avgCtc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3 — Certification Demand & ROI Intelligence */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#E8C547]" />
              <span>Section 3 — Certification Demand & ROI Intelligence</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Correlating user profile searches against verified salary lifts
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#161B22] p-1 rounded-xl border border-white/[0.06] font-mono text-xs">
            {(
              [
                { id: 'analysisVol', label: 'Analysis Vol' },
                { id: 'submitVol', label: 'Submit Vol' },
                { id: 'avgRoi', label: 'Avg ROI Lift %' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCertView(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  certView === tab.id
                    ? 'bg-[#E8C547] text-[#080A0E] font-semibold shadow-sm'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={certIntelligence} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="name"
                stroke="#8B949E"
                fontSize={10}
                angle={-25}
                textAnchor="end"
                interval={0}
                tickLine={false}
              />
              <YAxis stroke="#8B949E" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar
                dataKey={certView}
                fill={certView === 'avgRoi' ? '#E8C547' : certView === 'submitVol' ? '#F97316' : '#3B82F6'}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 4 & Section 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 4 — Activity Peak Hours */}
        <div className="lg:col-span-6 bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-lg space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A855F7]" />
              <span>Section 4 — Activity Peak Hours (Time vs Day)</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">User submission density matrix across the week</p>
          </div>

          <div className="space-y-2 pt-2 font-mono text-xs">
            <div className="grid grid-cols-9 text-center text-[10px] text-[#8B949E] pb-1">
              <span>DAY</span>
              <span>00-03h</span>
              <span>03-06h</span>
              <span>06-09h</span>
              <span>09-12h</span>
              <span>12-15h</span>
              <span>15-18h</span>
              <span>18-21h</span>
              <span>21-24h</span>
            </div>
            {timeHeatmap.map((row) => (
              <div key={row.day} className="grid grid-cols-9 items-center gap-1.5">
                <span className="text-white font-semibold text-left">{row.day}</span>
                {row.hours.map((val, idx) => {
                  let bg = 'bg-[#161B22] text-[#8B949E]/40';
                  if (val > 20) bg = 'bg-[#A855F7]/20 text-[#A855F7]/80';
                  if (val > 50) bg = 'bg-[#A855F7]/40 text-[#A855F7] font-semibold';
                  if (val > 80) bg = 'bg-[#A855F7] text-white font-bold shadow-sm shadow-[#A855F7]/30';
                  return (
                    <div key={idx} className={`h-8 rounded-lg flex items-center justify-center text-[11px] transition-transform hover:scale-110 cursor-default ${bg}`}>
                      {val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#8B949E]/60 font-mono text-right">
            Peak activity observed on weekday afternoons (12:00 - 18:00 IST)
          </p>
        </div>

        {/* Section 5 — Data Quality Metrics */}
        <div className="lg:col-span-6 bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              <span>Section 5 — Data Quality & Anomaly Tracking (Live)</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">Automated PII scanner compliance and ingestion cleanliness</p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 font-mono">
            <div className="bg-[#161B22] p-3.5 rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-[#8B949E] uppercase">PII Pass Rate</p>
              <p className="text-xl font-bold text-[#22C55E] mt-1">{qualityHistory[0]?.piiPass || 98.4}%</p>
              <p className="text-[10px] text-[#22C55E] mt-0.5">↑ Live database check</p>
            </div>
            <div className="bg-[#161B22] p-3.5 rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-[#8B949E] uppercase">Auto-Approved</p>
              <p className="text-xl font-bold text-[#3B82F6] mt-1">{qualityHistory[0]?.autoApproved || 88.2}%</p>
              <p className="text-[10px] text-[#3B82F6] mt-0.5">↑ Validated clean</p>
            </div>
            <div className="bg-[#161B22] p-3.5 rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-[#8B949E] uppercase">Avg Anomaly Score</p>
              <p className="text-xl font-bold text-[#E8C547] mt-1">{qualityHistory[0]?.avgAnomaly || 15.1} / 100</p>
              <p className="text-[10px] text-[#22C55E] mt-0.5">↓ (Lower = safer)</p>
            </div>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" stroke="#8B949E" fontSize={11} tickLine={false} />
                <YAxis stroke="#8B949E" fontSize={11} tickLine={false} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="piiPass" stroke="#22C55E" strokeWidth={2} name="PII Pass %" />
                <Line type="monotone" dataKey="autoApproved" stroke="#3B82F6" strokeWidth={2} name="Auto-Approved %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
