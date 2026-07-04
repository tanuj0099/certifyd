'use client';

import React, { useState } from 'react';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { saveStagingRecordAction, pushStagingToLiveAction } from '../../actions/dataActions';
import {
  Award,
  Database,
  Edit3,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CertRecord {
  id: string;
  name: string;
  vendor: string;
  domain: string;
  avg_salary_lift: string;
  demand_score: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  last_verified: string;
  serving_status: 'serving' | 'stale' | 'needs_review';
  career_stage: string;
  skills: string[];
  diff_summary?: {
    field: string;
    old_val: string;
    new_val: string;
  }[];
}

interface CertificationsClientProps {
  initialLive: CertRecord[];
  initialStaging: CertRecord[];
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
}

export function CertificationsClient({ initialLive, initialStaging, userRole }: CertificationsClientProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'staging'>('live');
  const [liveList, setLiveList] = useState<CertRecord[]>(initialLive);
  const [stagingList, setStagingList] = useState<CertRecord[]>(initialStaging);

  // Edit slide-over
  const [editingCert, setEditingCert] = useState<CertRecord | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [skillsInput, setSkillsInput] = useState<string>('');

  // Push modal
  const [showPushModal, setShowPushModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  function openEdit(cert: CertRecord) {
    setEditingCert(cert);
    setEditForm({ ...cert });
    setSkillsInput(cert.skills?.join(', ') || '');
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
            field: 'avg_salary_lift',
            old_val: editingCert?.avg_salary_lift || '28%',
            new_val: editForm.avg_salary_lift,
          },
          {
            field: 'demand_score',
            old_val: String(editingCert?.demand_score || 8),
            new_val: String(editForm.demand_score),
          },
        ],
      };

      await saveStagingRecordAction('certifications_staging', updatedRecord);

      // Update local staging list
      setStagingList((prev) => {
        const idx = prev.findIndex((i) => i.id === updatedRecord.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedRecord;
          return next;
        }
        return [updatedRecord, ...prev];
      });

      showToast(`Saved "${updatedRecord.name}" to staging queue ✓`, 'success');
      setEditingCert(null);
      setActiveTab('staging');
    } catch (err: any) {
      showToast(err.message || 'Failed to save staging record', 'error');
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
      const res = await pushStagingToLiveAction('certifications');
      // Merge staging into live locally
      setLiveList((prev) => {
        const next = [...prev];
        stagingList.forEach((s) => {
          const idx = next.findIndex((l) => l.id === s.id);
          if (idx >= 0) next[idx] = { ...s, serving_status: 'serving', last_verified: new Date().toISOString() };
          else next.unshift({ ...s, serving_status: 'serving', last_verified: new Date().toISOString() });
        });
        return next;
      });
      setStagingList([]);
      setShowPushModal(false);
      showToast(`Pushed ${res.count} certification updates to live production on certifyd.in! 🚀`, 'success');
      setActiveTab('live');
    } catch (err: any) {
      showToast(err.message || 'Push to live failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Certifications Reference Table</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Core knowledge graph serving ROI calculations on certifyd.in
          </p>
        </div>

        {/* Tab Switcher */}
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

      {/* STAGING TAB TOP BAR */}
      {activeTab === 'staging' && (
        <div className="bg-gradient-to-r from-[#161B22] via-[#0F1218] to-[#161B22] border border-[#3B82F6]/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Staging Workflow ({stagingList.length} updates pending)
              </h3>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Review diff summaries below. Pushing to live instantly updates the production database serving certifyd.in.
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
                <span>PUSH {stagingList.length} UPDATES TO LIVE 🚀</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#161B22]/60 text-[#8B949E] font-mono uppercase tracking-wider">
                <th className="py-3.5 px-4 font-medium">STATUS</th>
                <th className="py-3.5 px-4 font-medium">CERTIFICATION NAME</th>
                <th className="py-3.5 px-4 font-medium">VENDOR</th>
                <th className="py-3.5 px-4 font-medium">DOMAIN</th>
                <th className="py-3.5 px-4 font-medium text-right">AVG SALARY LIFT</th>
                <th className="py-3.5 px-4 font-medium text-right">DEMAND SCORE</th>
                <th className="py-3.5 px-4 font-medium">DIFFICULTY</th>
                <th className="py-3.5 px-4 font-medium">LAST VERIFIED</th>
                <th className="py-3.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(activeTab === 'live' ? liveList : stagingList).length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8B949E] font-mono">
                    {activeTab === 'live'
                      ? 'No live certification records found.'
                      : 'Staging queue is clean — no pending updates waiting to push ✓'}
                  </td>
                </tr>
              ) : (
                (activeTab === 'live' ? liveList : stagingList).map((cert) => {
                  const isStaging = activeTab === 'staging';

                  return (
                    <tr key={cert.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-mono">
                        {isStaging ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                            STAGED DIFF
                          </span>
                        ) : cert.serving_status === 'serving' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                            SERVING
                          </span>
                        ) : cert.serving_status === 'stale' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8C547]" />
                            STALE &gt;30d
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F85149]" />
                            NEEDS REVIEW
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium text-white">
                        <div>
                          <span>{cert.name}</span>
                          {isStaging && cert.diff_summary && (
                            <div className="mt-1 flex flex-wrap gap-2 font-mono text-[11px]">
                              {cert.diff_summary.map((d, idx) => (
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
                      <td className="py-4 px-4 text-[#8B949E] font-mono">{cert.vendor}</td>
                      <td className="py-4 px-4 text-white">{cert.domain}</td>
                      <td className="py-4 px-4 font-mono text-right font-bold text-[#00D4A8]">{cert.avg_salary_lift}</td>
                      <td className="py-4 px-4 font-mono text-right font-bold text-[#E8C547]">{cert.demand_score} / 10</td>
                      <td className="py-4 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#8B949E] text-[11px]">
                          {cert.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#8B949E]">
                        {new Date(cert.last_verified).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => openEdit(cert)}
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

      {/* Push to Live Modal */}
      <ConfirmModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        onConfirm={handleConfirmPush}
        title={`Push ${stagingList.length} Staged Certifications to Live Production`}
        impact="This will instantly overwrite live production tables on certifyd.in. All ROI calculations performed by active users will immediately use these new salary lift and demand score benchmarks."
        confirmWord="PUSH"
        loading={loading}
      />

      {/* Edit Slide-over Panel */}
      <AnimatePresence>
        {editingCert && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setEditingCert(null)} />
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
                    <h3 className="text-sm font-semibold text-white font-mono">Stage Certification Benchmark</h3>
                    <p className="text-xs text-[#8B949E] mt-0.5 truncate max-w-[260px]">{editingCert.name}</p>
                  </div>
                </div>
                <button onClick={() => setEditingCert(null)} className="p-1 text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaging} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Certification Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    disabled
                    className="w-full bg-[#161B22] border border-white/[0.04] rounded-xl px-3.5 py-2 text-sm text-[#8B949E] font-mono cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Avg Salary Lift %</label>
                    <input
                      type="text"
                      required
                      value={editForm.avg_salary_lift || ''}
                      onChange={(e) => setEditForm({ ...editForm, avg_salary_lift: e.target.value })}
                      placeholder="e.g. 32%"
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Demand Score (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={editForm.demand_score || 8}
                      onChange={(e) => setEditForm({ ...editForm, demand_score: Number(e.target.value) })}
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Difficulty Level</label>
                    <select
                      value={editForm.difficulty || 'Intermediate'}
                      onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Career Stage</label>
                    <input
                      type="text"
                      value={editForm.career_stage || 'Mid-Level'}
                      onChange={(e) => setEditForm({ ...editForm, career_stage: e.target.value })}
                      placeholder="e.g. Mid-Level (3-6 yrs)"
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">
                    Primary Skills Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="AWS, VPC, EC2, Terraform, IAM"
                    className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#00D4A8]/10 border border-[#00D4A8]/20 text-xs text-[#00D4A8] leading-relaxed">
                  <strong>Staging Safety Notice:</strong> Saving changes places them in the staging queue. They will NOT affect calculations on certifyd.in until a Super Admin executes "Push to Live".
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCert(null)}
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
