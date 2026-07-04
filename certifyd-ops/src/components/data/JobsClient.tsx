'use client';

import React, { useState } from 'react';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { saveStagingRecordAction, pushStagingToLiveAction } from '../../actions/dataActions';
import {
  Briefcase,
  Database,
  Edit3,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface JobRecord {
  id: string;
  title: string;
  city: string;
  exp_band: string;
  median_ctc: string;
  p75_ctc: string;
  sample_size: number;
  source: string;
  last_scraped: string;
  serving_status: 'serving' | 'stale' | 'needs_review';
  top_cert: string;
  skills: string[];
  diff_summary?: {
    field: string;
    old_val: string;
    new_val: string;
  }[];
}

interface JobsClientProps {
  initialLive: JobRecord[];
  initialStaging: JobRecord[];
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
}

export function JobsClient({ initialLive, initialStaging, userRole }: JobsClientProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'staging'>('live');
  const [liveList, setLiveList] = useState<JobRecord[]>(initialLive);
  const [stagingList, setStagingList] = useState<JobRecord[]>(initialStaging);

  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [skillsInput, setSkillsInput] = useState<string>('');

  const [showPushModal, setShowPushModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  function openEdit(job: JobRecord) {
    setEditingJob(job);
    setEditForm({ ...job });
    setSkillsInput(job.skills?.join(', ') || '');
  }

  async function handleSaveStaging(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parsedSkills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const updatedRecord = {
        ...editForm,
        skills: parsedSkills,
        staged_by: 'current_admin',
        staged_at: new Date().toISOString(),
        diff_summary: [
          {
            field: 'median_ctc',
            old_val: editingJob?.median_ctc || '₹16.0L',
            new_val: editForm.median_ctc,
          },
          {
            field: 'sample_size',
            old_val: String(editingJob?.sample_size || 45),
            new_val: String(editForm.sample_size),
          },
        ],
      };

      await saveStagingRecordAction('market_jobs_staging', updatedRecord);

      setStagingList((prev) => {
        const idx = prev.findIndex((i) => i.id === updatedRecord.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedRecord;
          return next;
        }
        return [updatedRecord, ...prev];
      });

      showToast(`Saved "${updatedRecord.title}" (${updatedRecord.city}) to staging queue ✓`, 'success');
      setEditingJob(null);
      setActiveTab('staging');
    } catch (err: any) {
      showToast(err.message || 'Failed to save staging job', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPush() {
    if (userRole !== 'SUPER_ADMIN') {
      showToast('Super Admin required to push changes to live.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await pushStagingToLiveAction('jobs');
      setLiveList((prev) => {
        const next = [...prev];
        stagingList.forEach((s) => {
          const idx = next.findIndex((l) => l.id === s.id);
          if (idx >= 0) next[idx] = { ...s, serving_status: 'serving', last_scraped: new Date().toISOString() };
          else next.unshift({ ...s, serving_status: 'serving', last_scraped: new Date().toISOString() });
        });
        return next;
      });
      setStagingList([]);
      setShowPushModal(false);
      showToast(`Pushed ${res.count} job market salary updates to live production on certifyd.in! 🚀`, 'success');
      setActiveTab('live');
    } catch (err: any) {
      showToast(err.message || 'Push to live failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Market Jobs Reference Table</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Real-time scraped compensation medians and confidence samples serving certifyd.in
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#0F1218] p-1 rounded-xl border border-white/[0.06] font-mono text-xs">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-[#00D4A8] text-[#080A0E] font-semibold shadow-sm'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Live Table ({liveList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('staging')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 relative ${
              activeTab === 'staging'
                ? 'bg-[#3B82F6] text-white font-semibold shadow-sm'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Staging Table ({stagingList.length})</span>
            {stagingList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#E8C547] animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'staging' && (
        <div className="bg-gradient-to-r from-[#161B22] via-[#0F1218] to-[#161B22] border border-[#3B82F6]/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Staged Salary Benchmarks ({stagingList.length} updates waiting)
              </h3>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Review diff summaries below. Pushing updates compensation percentiles across certifyd.in ROI calculators.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userRole === 'TEAM_MEMBER' ? (
              <div
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#8B949E] text-xs font-mono font-medium flex items-center gap-2 cursor-not-allowed"
                title="Super Admin required to push changes to live"
              >
                <Lock className="w-4 h-4 text-[#E8C547]" />
                <span>PUSH TO LIVE (LOCKED FOR TEAM)</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (stagingList.length === 0) showToast('Staging queue is empty.', 'info');
                  else setShowPushModal(true);
                }}
                disabled={stagingList.length === 0 || loading}
                className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#080A0E] text-xs font-bold font-mono transition-all shadow-lg shadow-[#22C55E]/20 disabled:opacity-40 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PUSH {stagingList.length} JOB BENCHMARKS 🚀</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#161B22]/60 text-[#8B949E] font-mono uppercase tracking-wider">
                <th className="py-3.5 px-4 font-medium">STATUS</th>
                <th className="py-3.5 px-4 font-medium">JOB TITLE</th>
                <th className="py-3.5 px-4 font-medium">CITY</th>
                <th className="py-3.5 px-4 font-medium">EXP BAND</th>
                <th className="py-3.5 px-4 font-medium text-right">MEDIAN CTC</th>
                <th className="py-3.5 px-4 font-medium text-right">75TH PERCENTILE</th>
                <th className="py-3.5 px-4 font-medium text-right">SAMPLE SIZE</th>
                <th className="py-3.5 px-4 font-medium">SOURCE / SCRAPED</th>
                <th className="py-3.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(activeTab === 'live' ? liveList : stagingList).length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8B949E] font-mono">
                    {activeTab === 'live'
                      ? 'No live job market benchmarks found.'
                      : 'Staging queue is clean — no pending job updates waiting to push ✓'}
                  </td>
                </tr>
              ) : (
                (activeTab === 'live' ? liveList : stagingList).map((job) => {
                  const isStaging = activeTab === 'staging';
                  const isLowConfidence = job.sample_size < 30;

                  return (
                    <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-mono">
                        {isStaging ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                            STAGED DIFF
                          </span>
                        ) : job.serving_status === 'serving' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                            SERVING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8C547]" />
                            NEEDS REVIEW
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium text-white">
                        <div>
                          <span>{job.title}</span>
                          {isStaging && job.diff_summary && (
                            <div className="mt-1 flex flex-wrap gap-2 font-mono text-[11px]">
                              {job.diff_summary.map((d, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-[#161B22] border border-white/10 text-[#8B949E]">
                                  {d.field}: <span className="line-through text-[#F85149]">{d.old_val}</span>{' '}
                                  <ArrowRight className="w-3 h-3 inline text-[#8B949E]" />{' '}
                                  <span className="text-[#22C55E] font-bold">{d.new_val}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white font-medium flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                        <span>{job.city}</span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#8B949E]">{job.exp_band}</td>
                      <td className="py-4 px-4 font-mono text-right font-bold text-[#00D4A8]">{job.median_ctc}</td>
                      <td className="py-4 px-4 font-mono text-right font-bold text-[#22C55E]">{job.p75_ctc}</td>
                      <td className="py-4 px-4 font-mono text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-white">{job.sample_size} postings</span>
                          {isLowConfidence && (
                            <span className="text-[10px] text-[#E8C547] bg-[#E8C547]/10 px-1.5 py-0.2 rounded mt-0.5 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Low Confidence
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#8B949E]">
                        <div>{job.source}</div>
                        <div className="text-[10px] text-[#8B949E]/60">{new Date(job.last_scraped).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => openEdit(job)}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#00D4A8]/15 hover:text-[#00D4A8] text-white font-mono text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isStaging ? 'Edit Staged' : 'Edit to Staging'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        onConfirm={handleConfirmPush}
        title={`Push ${stagingList.length} Staged Job Benchmarks to Live Production`}
        impact="This will instantly overwrite live market salary medians on certifyd.in. Candidates evaluating their CTC against regional percentiles will immediately see these updated figures."
        confirmWord="PUSH"
        loading={loading}
      />

      <AnimatePresence>
        {editingJob && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setEditingJob(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-50 bg-[#0F1218] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#161B22]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00D4A8]/10 border border-[#00D4A8]/20 flex items-center justify-center text-[#00D4A8]">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono">Stage Job Market Benchmark</h3>
                    <p className="text-xs text-[#8B949E] mt-0.5">{editingJob.title} • {editingJob.city}</p>
                  </div>
                </div>
                <button onClick={() => setEditingJob(null)} className="p-1 text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaging} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Median CTC</label>
                    <input
                      type="text"
                      required
                      value={editForm.median_ctc || ''}
                      onChange={(e) => setEditForm({ ...editForm, median_ctc: e.target.value })}
                      placeholder="₹16.5L"
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">75th Percentile CTC</label>
                    <input
                      type="text"
                      required
                      value={editForm.p75_ctc || ''}
                      onChange={(e) => setEditForm({ ...editForm, p75_ctc: e.target.value })}
                      placeholder="₹22.0L"
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Sample Size (postings)</label>
                    <input
                      type="number"
                      required
                      value={editForm.sample_size || 45}
                      onChange={(e) => setEditForm({ ...editForm, sample_size: Number(e.target.value) })}
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Top Certification</label>
                    <input
                      type="text"
                      value={editForm.top_cert || ''}
                      onChange={(e) => setEditForm({ ...editForm, top_cert: e.target.value })}
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">
                    Skills in Demand (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="Kubernetes, Terraform, AWS, Python, CI/CD"
                    className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#00D4A8]/10 border border-[#00D4A8]/20 text-xs text-[#00D4A8] leading-relaxed">
                  <strong>Staging Safety Notice:</strong> Changes are saved to the staging queue and will only go live when a Super Admin executes "Push to Live".
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-[#8B949E] hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#00D4A8] text-[#080A0E] hover:bg-[#00D4A8]/90 font-bold text-xs font-mono shadow-lg shadow-[#00D4A8]/20 transition-all flex items-center gap-2"
                  >
                    {loading && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                    <span>Save to Staging Queue</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
