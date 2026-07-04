'use client';

import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { Filter, MapPin, Award, Clock, ShieldCheck, TrendingUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FUNNEL_DATA = [
  { stage: 'Total Sessions', count: 18450, percentage: '100%', fill: '#3B82F6' },
  { stage: 'Tool Opens', count: 14200, percentage: '77.0%', fill: '#00D4A8' },
  { stage: 'Analyses Completed', count: 8940, percentage: '48.5%', fill: '#E8C547' },
  { stage: 'Data Submitted', count: 2081, percentage: '11.3%', fill: '#A855F7' },
];

const CITY_DATA = [
  { city: 'Bengaluru', submissions: 1140, avgCtc: '₹18.4L', topCert: 'AWS Solutions Architect', growth: '+28%', x: 42, y: 75, volume: 24 },
  { city: 'Hyderabad', submissions: 420, avgCtc: '₹16.2L', topCert: 'Azure Administrator 104', growth: '+19%', x: 48, y: 65, volume: 16 },
  { city: 'Pune', submissions: 280, avgCtc: '₹14.8L', topCert: 'AWS Solutions Architect', growth: '+14%', x: 30, y: 58, volume: 14 },
  { city: 'Delhi / NCR', submissions: 190, avgCtc: '₹17.5L', topCert: 'GCP Professional Cloud', growth: '+22%', x: 38, y: 28, volume: 12 },
  { city: 'Chennai', submissions: 135, avgCtc: '₹13.9L', topCert: 'Cisco CCNA / CCNP', growth: '+9%', x: 50, y: 80, volume: 10 },
];

const CERT_INTELLIGENCE = [
  { name: 'AWS Certified Solutions Architect', analysisVol: 4120, submitVol: 890, avgRoi: 88 },
  { name: 'Azure Administrator Associate (AZ-104)', analysisVol: 3240, submitVol: 650, avgRoi: 84 },
  { name: 'Google Cloud Professional Architect', analysisVol: 1890, submitVol: 240, avgRoi: 91 },
  { name: 'Certified Kubernetes Administrator (CKA)', analysisVol: 1650, submitVol: 310, avgRoi: 94 },
  { name: 'Cisco Certified Network Associate (CCNA)', analysisVol: 1420, submitVol: 420, avgRoi: 72 },
  { name: 'AWS Certified Security - Specialty', analysisVol: 1100, submitVol: 180, avgRoi: 89 },
  { name: 'Microsoft Certified: Azure Solutions Arch.', analysisVol: 980, submitVol: 190, avgRoi: 86 },
  { name: 'HashiCorp Certified: Terraform Associate', analysisVol: 850, submitVol: 210, avgRoi: 82 },
];

const TIME_HEATMAP = [
  { day: 'Mon', hours: [5, 12, 28, 45, 80, 95, 60, 40] },
  { day: 'Tue', hours: [8, 15, 35, 50, 88, 102, 65, 45] },
  { day: 'Wed', hours: [6, 18, 40, 55, 92, 110, 70, 48] },
  { day: 'Thu', hours: [10, 20, 38, 60, 85, 98, 62, 42] },
  { day: 'Fri', hours: [12, 22, 42, 65, 78, 85, 50, 30] },
  { day: 'Sat', hours: [25, 45, 60, 75, 65, 55, 40, 25] },
  { day: 'Sun', hours: [30, 50, 70, 85, 75, 60, 45, 28] },
];

const QUALITY_HISTORY = [
  { week: 'W1', piiPass: 96.2, autoApproved: 82.0, avgAnomaly: 18.5 },
  { week: 'W2', piiPass: 97.1, autoApproved: 84.5, avgAnomaly: 17.2 },
  { week: 'W3', piiPass: 98.0, autoApproved: 86.8, avgAnomaly: 16.0 },
  { week: 'W4', piiPass: 98.4, autoApproved: 88.2, avgAnomaly: 15.1 },
];

export default function AnalyticsPage() {
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
            Deep funnel conversion, geographic distribution, and data quality trends
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
                  ? 'bg-[#00D4A8] text-[#080A0E] font-semibold shadow-sm shadow-[#00D4A8]/20'
                  : 'text-[#8B949E] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {selectedCity && (
        <div className="bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#00D4A8]">
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00D4A8]" />
              <span>Section 1 — Traffic & Conversion Funnel ({range})</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">How users move from initial landing session to verified data submission</p>
          </div>
          <span className="text-xs font-mono text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg border border-[#22C55E]/20">
            Overall Conversion: 11.3%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {FUNNEL_DATA.map((item, i) => (
            <div key={item.stage} className="bg-[#161B22] border border-white/[0.04] rounded-xl p-4 relative overflow-hidden group">
              <div
                className="absolute bottom-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: item.fill }}
              />
              <p className="text-xs font-mono text-[#8B949E] uppercase tracking-wider">{item.stage}</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">{item.count.toLocaleString()}</span>
                <span className="text-xs font-mono font-semibold" style={{ color: item.fill }}>
                  {item.percentage}
                </span>
              </div>
              {i > 0 && (
                <p className="text-[10px] text-[#8B949E]/60 mt-2 font-mono">
                  Dropoff from prev: {Math.round(100 - (item.count / FUNNEL_DATA[i - 1].count) * 100)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — Geographic Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#3B82F6]" />
              <span>Section 2 — India City Distribution</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">Click a city dot to filter dashboard analytics</p>
          </div>

          {/* SVG India Map Simulation */}
          <div className="my-6 relative w-full h-64 bg-[#161B22]/60 rounded-xl border border-white/[0.04] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />
            <p className="absolute top-3 left-3 text-[10px] font-mono text-[#8B949E]">INDIA TECH HUBS HEATMAP</p>
            
            {CITY_DATA.map((city) => {
              const isSelected = selectedCity === city.city;
              return (
                <button
                  key={city.city}
                  onClick={() => setSelectedCity(city.city === selectedCity ? null : city.city)}
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform hover:scale-125 group z-10 ${
                    isSelected ? 'scale-125 z-20' : ''
                  }`}
                >
                  <span
                    className={`rounded-full animate-ping absolute opacity-40 ${
                      isSelected ? 'bg-[#00D4A8]' : 'bg-[#3B82F6]'
                    }`}
                    style={{ width: city.volume * 1.5, height: city.volume * 1.5 }}
                  />
                  <span
                    className={`rounded-full shadow-lg flex items-center justify-center text-[9px] font-mono font-bold text-white border ${
                      isSelected
                        ? 'bg-[#00D4A8] border-white text-[#080A0E]'
                        : 'bg-[#3B82F6] border-[#3B82F6]/60'
                    }`}
                    style={{ width: city.volume, height: city.volume }}
                  />
                  <span className="absolute left-full ml-2 bg-[#080A0E]/90 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    {city.city}: {city.submissions} subs ({city.growth})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#8B949E] font-mono flex items-center justify-between border-t border-white/[0.04] pt-3">
            <span>Top Hub: <strong className="text-white">Bengaluru</strong> (54% total)</span>
            <span className="text-[#00D4A8]">YoY Growth: +24%</span>
          </div>
        </div>

        {/* City Table */}
        <div className="lg:col-span-7 bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-lg flex flex-col justify-between overflow-x-auto">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Hub Performance Breakdown</h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#8B949E] font-mono">
                  <th className="pb-3 font-medium">CITY</th>
                  <th className="pb-3 font-medium text-right">SUBMISSIONS</th>
                  <th className="pb-3 font-medium text-right">AVG CTC</th>
                  <th className="pb-3 font-medium">TOP CERTIFICATION</th>
                  <th className="pb-3 font-medium text-right">GROWTH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {CITY_DATA.map((c) => (
                  <tr
                    key={c.city}
                    onClick={() => setSelectedCity(c.city === selectedCity ? null : c.city)}
                    className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${
                      selectedCity === c.city ? 'bg-[#00D4A8]/10' : ''
                    }`}
                  >
                    <td className="py-3.5 font-medium text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                      <span>{c.city}</span>
                    </td>
                    <td className="py-3.5 font-mono text-right text-white font-semibold">{c.submissions}</td>
                    <td className="py-3.5 font-mono text-right text-[#00D4A8]">{c.avgCtc}</td>
                    <td className="py-3.5 text-[#8B949E] truncate max-w-[160px] font-mono">{c.topCert}</td>
                    <td className="py-3.5 font-mono text-right text-[#22C55E] font-semibold">{c.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[#8B949E]/60 font-mono mt-4 text-right">
            Showing all 5 active metropolitan hubs • Updated hourly
          </p>
        </div>
      </div>

      {/* Section 3 — Certification Intelligence */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#E8C547]" />
              <span>Section 3 — Top Certification Demand & ROI Score</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">Which certs users are most curious about vs which they actually hold</p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#161B22] p-1 rounded-xl border border-white/[0.06] font-mono text-xs">
            {[
              { id: 'analysisVol', label: 'Analysis Volume' },
              { id: 'submitVol', label: 'Submission Volume' },
              { id: 'avgRoi', label: 'Avg ROI Score' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCertView(tab.id as any)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
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
            <BarChart data={CERT_INTELLIGENCE} layout="vertical" margin={{ left: 140, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" stroke="#8B949E" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#F0F6FC"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={160}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#F0F6FC', fontWeight: 'bold' }}
              />
              <Bar
                dataKey={certView === 'analysisVol' ? 'analysisVol' : certView === 'submitVol' ? 'submitVol' : 'avgRoi'}
                fill={certView === 'analysisVol' ? '#00D4A8' : certView === 'submitVol' ? '#3B82F6' : '#E8C547'}
                radius={[0, 6, 6, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 4 & 5 — Time Patterns & Data Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 4 — Time Patterns Heatmap */}
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
            {TIME_HEATMAP.map((row) => (
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
              <span>Section 5 — Data Quality & Anomaly Tracking</span>
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">Automated PII scanner compliance and ingestion cleanliness</p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 font-mono">
            <div className="bg-[#161B22] p-3.5 rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-[#8B949E] uppercase">PII Pass Rate</p>
              <p className="text-xl font-bold text-[#22C55E] mt-1">98.4%</p>
              <p className="text-[10px] text-[#22C55E] mt-0.5">↑ 0.4% this week</p>
            </div>
            <div className="bg-[#161B22] p-3.5 rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-[#8B949E] uppercase">Auto-Approved</p>
              <p className="text-xl font-bold text-[#3B82F6] mt-1">88.2%</p>
              <p className="text-[10px] text-[#3B82F6] mt-0.5">↑ 1.4% this week</p>
            </div>
            <div className="bg-[#161B22] p-3.5 rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-[#8B949E] uppercase">Avg Anomaly Score</p>
              <p className="text-xl font-bold text-[#E8C547] mt-1">15.1 / 100</p>
              <p className="text-[10px] text-[#22C55E] mt-0.5">↓ 0.9 (Lower = safer)</p>
            </div>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={QUALITY_HISTORY}>
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
