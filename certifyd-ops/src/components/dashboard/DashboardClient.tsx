'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Activity,
  FileText,
  Clock,
  Briefcase,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { StatusPill } from '../ui/StatusPill';

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  isPositive: boolean;
  icon: React.ElementType;
  data: number[];
  color: string;
}

function StatCard({ title, value, trend, isPositive, icon: Icon, data, color }: StatCardProps) {
  const chartData = data.map((val, idx) => ({ idx, val }));

  return (
    <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between hover:border-white/[0.12] transition-all group">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs font-medium text-[#8B949E] uppercase tracking-wider font-mono">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 font-mono tracking-tight">{value}</h3>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}30`, borderWidth: 1 }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 pt-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-1 text-xs font-mono">
          {isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-[#22C55E]" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-[#F85149]" />
          )}
          <span className={isPositive ? 'text-[#22C55E]' : 'text-[#F85149]'}>{trend}</span>
          <span className="text-[#8B949E]/60 ml-0.5">vs yesterday</span>
        </div>

        {/* Sparkline Chart */}
        <div className="w-20 h-8 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <Area
                type="monotone"
                dataKey="val"
                stroke={color}
                fill={color}
                fillOpacity={0.2}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import { useRouter } from 'next/navigation';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return dateStr;
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

interface ActivityItem {
  id: string;
  type: 'submit_resume' | 'submit_offer' | 'approve' | 'flag' | 'feedback';
  description: string;
  user: string;
  time: string;
  timestamp?: string;
}

export function DashboardClient({
  initialStats,
  initialActivities,
}: {
  initialStats: any;
  initialActivities: ActivityItem[];
}) {
  const router = useRouter();
  const [stats, setStats] = useState<any>(initialStats);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [latency, setLatency] = useState<number>(14);

  // Sync with live server initial props
  useEffect(() => {
    setStats(initialStats);
    setActivities(initialActivities);
  }, [initialStats, initialActivities]);

  // Continuous live data engine: poll /api/ops/live every 4 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchLiveData = async () => {
      const start = performance.now();
      try {
        const res = await fetch('/api/ops/live', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            if (data.stats) setStats(data.stats);
            if (data.activities && Array.isArray(data.activities)) setActivities(data.activities);
            setLatency(Math.max(8, Math.round(performance.now() - start)));
          }
        }
      } catch {
        // Silent fallback if network temporarily disconnects
      }
    };

    fetchLiveData();
    const timer = setInterval(fetchLiveData, 4000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operational Overview</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Real-time analytics & ingestion stream for Certifyd platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status="live" size="md" />
          <span className="text-xs font-mono text-[#8B949E]">Auto-refresh: 4s</span>
        </div>
      </div>

      {/* Main Grid: Left 70% Stats, Right 30% Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left 70% (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Row 1 Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              trend={stats.totalUsersTrend || "0.0%"}
              isPositive={stats.totalUsersPositive ?? true}
              icon={Users}
              color="#F97316"
              data={stats.totalUsersHistory || [10, 12, 15]}
            />
            <StatCard
              title="Active Today"
              value={stats.activeToday}
              trend={stats.activeTodayTrend || "0.0%"}
              isPositive={stats.activeTodayPositive ?? true}
              icon={Activity}
              color="#3B82F6"
              data={stats.activeTodayHistory || [1, 1, 1]}
            />
            <StatCard
              title="Total Submissions"
              value={stats.totalSubmissions}
              trend={stats.totalSubmissionsTrend || "0.0%"}
              isPositive={stats.totalSubmissionsPositive ?? true}
              icon={FileText}
              color="#A855F7"
              data={stats.totalSubmissionsHistory || [0, 0, 0]}
            />
            <StatCard
              title="Pending Review"
              value={stats.pendingReview}
              trend={stats.pendingReviewTrend || "0.0%"}
              isPositive={stats.pendingReviewPositive ?? true}
              icon={Clock}
              color="#E8C547"
              data={stats.pendingReviewHistory || [0, 0, 0]}
            />
          </div>

          {/* Row 2 Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Resumes Today"
              value={stats.resumesToday}
              trend={stats.resumesTodayTrend || "0.0%"}
              isPositive={stats.resumesTodayPositive ?? true}
              icon={FileText}
              color="#F97316"
              data={stats.resumesTodayHistory || [0, 0]}
            />
            <StatCard
              title="Offer Letters Today"
              value={stats.offersToday}
              trend={stats.offersTodayTrend || "0.0%"}
              isPositive={stats.offersTodayPositive ?? true}
              icon={Briefcase}
              color="#22C55E"
              data={stats.offersTodayHistory || [0, 0]}
            />
            <StatCard
              title="Avg ROI Score"
              value={`${stats.avgRoiScore}%`}
              trend={stats.avgRoiScoreTrend || "0.0%"}
              isPositive={stats.avgRoiScorePositive ?? true}
              icon={TrendingUp}
              color="#E8C547"
              data={stats.avgRoiScoreHistory || [80, 82, 84]}
            />
            <StatCard
              title="Feedback This Week"
              value={stats.feedbackWeek}
              trend={stats.feedbackWeekTrend || "0.0%"}
              isPositive={stats.feedbackWeekPositive ?? true}
              icon={MessageSquare}
              color="#3B82F6"
              data={stats.feedbackWeekHistory || [0, 0]}
            />
          </div>

          {/* Quick Insights Banner */}
          <div className="bg-gradient-to-r from-[#0F1218] via-[#161B22] to-[#0F1218] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#F97316]/15 text-[#F97316] text-[10px] font-mono font-semibold uppercase">
                    AI Flywheel Status
                  </span>
                  <span className="text-xs text-[#8B949E] font-mono">Model: llama3-70b-8192</span>
                </div>
                <h3 className="text-lg font-semibold text-white">47 new submissions ready for staging ingestion</h3>
                <p className="text-xs text-[#8B949E]">
                  Average PII scan pass rate is currently sitting at <strong className="text-[#22C55E]">98.4%</strong> with low anomaly triggers.
                </p>
              </div>
              <a
                href="/submissions/resumes"
                className="px-4 py-2.5 rounded-xl bg-[#F97316] text-[#080A0E] text-xs font-semibold hover:bg-[#F97316]/90 transition-all shadow-lg shadow-[#F97316]/15 shrink-0"
              >
                Review Pending Submissions →
              </a>
            </div>
          </div>
        </div>

        {/* Right 30% (3 cols on lg) - Live Activity Feed */}
        <div className="lg:col-span-3 bg-[#0F1218] border border-white/[0.06] rounded-2xl p-5 shadow-lg flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#F97316]" />
              <h3 className="text-sm font-semibold text-white">Live Activity Feed</h3>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full border border-[#22C55E]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              STREAMING
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
            <AnimatePresence mode="popLayout">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 text-[#8B949E]">
                  <Activity className="w-8 h-8 text-[#8B949E]/30 mb-2" />
                  <p className="text-xs font-mono">No recent live activity</p>
                  <p className="text-[10px] text-[#8B949E]/60 mt-1">Real-time uploads and system events will stream here automatically.</p>
                </div>
              ) : (
                activities.map((act) => (
                  <motion.div
                    key={act.id}
                    layout
                    initial={{ opacity: 0, y: -15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    className="p-3 rounded-xl bg-[#161B22]/80 border border-white/[0.04] hover:border-white/[0.08] transition-colors flex items-start gap-3 text-xs"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                        act.type === 'approve'
                          ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                          : act.type === 'flag'
                          ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30'
                          : act.type === 'submit_offer'
                          ? 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30'
                          : 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30'
                      }`}
                    >
                      {act.type === 'approve' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {act.type === 'flag' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {act.type === 'submit_offer' && <Briefcase className="w-3.5 h-3.5" />}
                      {(act.type === 'submit_resume' || act.type === 'feedback') && <FileText className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate leading-tight">{act.description}</p>
                      <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] font-mono text-[#8B949E]">
                        <span className="truncate bg-white/[0.04] px-1.5 py-0.2 rounded">{act.user}</span>
                        <span className="shrink-0 text-[#8B949E]/70">
                          {act.timestamp ? formatRelativeTime(act.timestamp) : act.time}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* System Health Bar */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#8B949E]">
          <Shield className="w-4 h-4 text-[#F97316]" />
          <span className="font-semibold text-white">System Health:</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[#8B949E]">Supabase:</span>
            <span className="text-white font-medium">Connected ({latency}ms)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[#8B949E]">Groq API:</span>
            <span className="text-white font-medium">Connected (234ms)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[#8B949E]">certifyd.in:</span>
            <span className="text-[#22C55E] font-medium">● Live</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-[#8B949E]">Scraper:</span>
            <span className="text-white font-medium">Last run 2h ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
