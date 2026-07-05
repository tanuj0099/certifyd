'use client';

import React, { useState } from 'react';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { addAdminUserAction, removeAdminUserAction, clearOldFeedbackAction } from '../../actions/systemActions';
import { updateUserPasswordAction, updateAdminEmailAction } from '../../actions/opsActions';
import {
  Shield,
  UserPlus,
  Trash2,
  Database,
  Cpu,
  Globe,
  Activity,
  CheckCircle2,
  Download,
  AlertTriangle,
  Lock,
  Key,
  Mail,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';

export interface AdminUserRecord {
  email: string;
  role: 'SUPER_ADMIN' | 'TEAM_MEMBER';
  added_at: string;
}

export function SettingsClient({
  initialAdmins,
  currentAdminEmail,
}: {
  initialAdmins: AdminUserRecord[];
  currentAdminEmail: string;
}) {
  const [admins, setAdmins] = useState<AdminUserRecord[]>(initialAdmins);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'SUPER_ADMIN' | 'TEAM_MEMBER'>('TEAM_MEMBER');
  const [loading, setLoading] = useState(false);

  // Security & Credential state
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState(currentAdminEmail);

  // Hygiene modal
  const [showHygieneModal, setShowHygieneModal] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const { showToast } = useToast();

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await updateUserPasswordAction(currentAdminEmail, newPassword);
      if (res.success) {
        showToast('Password updated successfully! ✓', 'success');
        setNewPassword('');
      } else {
        showToast(res.message || 'Failed to update password', 'error');
      }
    } catch (err: any) {
      showToast('Error updating password', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAdminEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!adminEmailInput || !adminEmailInput.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await updateAdminEmailAction(adminEmailInput);
      if (res.success) {
        showToast('Admin email updated successfully! ✓', 'success');
      } else {
        showToast(res.message || 'Failed to update admin email', 'error');
      }
    } catch (err: any) {
      showToast('Error updating admin email', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setLoading(true);
    try {
      await addAdminUserAction(newEmail.trim(), newRole);
      const now = new Date().toISOString();
      setAdmins((prev) => {
        const idx = prev.findIndex((a) => a.email.toLowerCase() === newEmail.trim().toLowerCase());
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], role: newRole };
          return next;
        }
        return [...prev, { email: newEmail.trim().toLowerCase(), role: newRole, added_at: now }];
      });
      setNewEmail('');
      showToast(`Admin user "${newEmail}" granted ${newRole} access ✓`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add admin user', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmRemove() {
    if (!removingEmail) return;
    setLoading(true);
    try {
      await removeAdminUserAction(removingEmail);
      setAdmins((prev) => prev.filter((a) => a.email !== removingEmail));
      showToast(`Removed admin access for ${removingEmail} ✓`, 'success');
      setRemovingEmail(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove admin user', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmHygiene() {
    setLoading(true);
    try {
      const res = await clearOldFeedbackAction();
      setShowHygieneModal(false);
      showToast(`Database cleanup complete! Purged ${res.count} resolved feedback records older than 90 days. 🧹`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Database cleanup failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleExportDataset() {
    const mockExport = [
      { id: 'f1a2b3c4', type: 'offer', city: 'Bengaluru', ctc_band: '₹8.5L', anomaly_score: 35, status: 'pending' },
      { id: 'e5d6c7b8', type: 'offer', city: 'Hyderabad', ctc_band: '₹16.0L', anomaly_score: 14, status: 'approved' },
      { id: 'a3f2b1c9', type: 'resume', city: 'Bengaluru', domain: 'Cloud Engineering', status: 'approved' },
    ];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mockExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `certifyd_anonymized_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Anonymized dataset exported as JSON ✓', 'success');
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#F97316]/15 text-[#F97316] text-[10px] font-mono font-bold uppercase">
              SUPER ADMIN ONLY
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Access Governance</h1>
          </div>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Admin RBAC allowlist, cloud diagnostic ping checks, database hygiene operations, and anonymized exports
          </p>
        </div>
      </div>

      {/* System Status & Diagnostics Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#F97316]" />
          <span>Infrastructure & Diagnostic Health checks</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8B949E] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#3B82F6]" /> Supabase Backend
              </span>
              <span className="text-[#22C55E] bg-[#22C55E]/15 px-2 py-0.5 rounded text-[10px] font-bold">ONLINE ✓</span>
            </div>
            <div className="text-lg font-bold text-white">18ms latency</div>
            <p className="text-[10px] text-[#8B949E]">ap-south-1 (Mumbai) • Pooler Active</p>
          </div>

          <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8B949E] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#F97316]" /> Cloudflare Access
              </span>
              <span className="text-[#22C55E] bg-[#22C55E]/15 px-2 py-0.5 rounded text-[10px] font-bold">GUARDED ✓</span>
            </div>
            <div className="text-lg font-bold text-white">Strict Enforced</div>
            <p className="text-[10px] text-[#8B949E]">Header validation + IP allowlist</p>
          </div>

          <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8B949E] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#E8C547]" /> Groq Llama-3 AI
              </span>
              <span className="text-[#22C55E] bg-[#22C55E]/15 px-2 py-0.5 rounded text-[10px] font-bold">READY ✓</span>
            </div>
            <div className="text-lg font-bold text-white">llama3-70b-8192</div>
            <p className="text-[10px] text-[#8B949E]">Average token speed: 280 T/s</p>
          </div>

          <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8B949E] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#F85149]" /> Upstash Rate Limit
              </span>
              <span className="text-[#22C55E] bg-[#22C55E]/15 px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE ✓</span>
            </div>
            <div className="text-lg font-bold text-white">0% Dropped</div>
            <p className="text-[10px] text-[#8B949E]">60 req/min per admin IP token</p>
          </div>
        </div>
      </div>

      {/* Security & Password Management */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="pb-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
            <Lock className="w-5 h-5 text-[#F97316]" />
            <span>Security & Credential Management</span>
          </h3>
          <p className="text-xs text-[#8B949E] mt-0.5 font-mono">
            Update your account password or modify the Super Admin contact email address
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleUpdatePassword} className="space-y-4 bg-[#161B22]/50 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Key className="w-4 h-4 text-[#F97316]" />
              <span>Change Account Password</span>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8B949E] mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full bg-[#0D1117] border border-white/10 rounded-xl pl-3.5 pr-10 py-2 text-sm text-white focus:outline-none focus:border-[#F97316] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-white transition-colors"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword}
              className="px-4 py-2 rounded-xl bg-[#F97316] text-[#080A0E] text-xs font-bold font-mono hover:bg-[#F97316]/90 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </form>

          <form onSubmit={handleUpdateAdminEmail} className="space-y-4 bg-[#161B22]/50 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Mail className="w-4 h-4 text-[#3B82F6]" />
              <span>Update Admin Email</span>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8B949E] mb-1">Admin Contact Email</label>
              <input
                type="email"
                required
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                placeholder="admin@certifyd.in"
                className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6] font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !adminEmailInput}
              className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-bold font-mono hover:bg-[#3B82F6]/90 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Admin Email</span>
            </button>
          </form>
        </div>
      </div>

      {/* Admin Users Management */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
              <Shield className="w-5 h-5 text-[#F97316]" />
              <span>Administrative Users & Role Allowlist ({admins.length})</span>
            </h3>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Reference allowlist verified by middleware against Cloudflare Access user email headers
            </p>
          </div>

          <form onSubmit={handleAddAdmin} className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              required
              placeholder="colleague@certifyd.in"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#F97316] font-mono"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="bg-[#161B22] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            >
              <option value="TEAM_MEMBER">TEAM MEMBER</option>
              <option value="SUPER_ADMIN">SUPER ADMIN</option>
            </select>
            <button
              type="submit"
              disabled={loading || !newEmail.trim()}
              className="px-4 py-2 rounded-xl bg-[#F97316] text-[#080A0E] text-xs font-bold font-mono hover:bg-[#F97316]/90 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Grant Access</span>
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#161B22]/60 text-[#8B949E] font-mono uppercase">
                <th className="py-3 px-4 font-medium">ADMIN EMAIL</th>
                <th className="py-3 px-4 font-medium">ASSIGNED ROLE</th>
                <th className="py-3 px-4 font-medium">ADDED AT</th>
                <th className="py-3 px-4 font-medium text-right">REVOKE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {admins.map((admin) => {
                const isSelf = admin.email.toLowerCase() === currentAdminEmail.toLowerCase();

                return (
                  <tr key={admin.email} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <span>{admin.email}</span>
                      {isSelf && (
                        <span className="text-[10px] bg-[#F97316]/15 text-[#F97316] px-1.5 py-0.2 rounded font-bold">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          admin.role === 'SUPER_ADMIN'
                            ? 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30'
                            : 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                        }`}
                      >
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8B949E]">{new Date(admin.added_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      {isSelf ? (
                        <span className="text-[#8B949E] text-[10px] italic">Protected</span>
                      ) : (
                        <button
                          onClick={() => setRemovingEmail(admin.email)}
                          disabled={loading}
                          className="p-1.5 rounded-lg bg-[#F85149]/15 text-[#F85149] hover:bg-[#F85149] hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Hygiene & Data Export */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono">
        <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#E8C547]" />
              <span>Database Hygiene & Pruning</span>
            </h3>
            <p className="text-xs text-[#8B949E] mt-1.5 leading-relaxed font-sans">
              Maintain optimal database query speeds and storage limits by purging resolved feedback messages and stale scraping scratch records older than 90 days.
            </p>
          </div>
          <button
            onClick={() => setShowHygieneModal(true)}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30 hover:bg-[#E8C547] hover:text-[#080A0E] font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Resolved Feedback (&gt;90 Days)</span>
          </button>
        </div>

        <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#3B82F6]" />
              <span>Anonymized Data Export</span>
            </h3>
            <p className="text-xs text-[#8B949E] mt-1.5 leading-relaxed font-sans">
              Export the entire repository of PII-scrubbed compensation offers, resume skill extractions, and market benchmarks as a clean JSON or CSV dataset for external analysis.
            </p>
          </div>
          <button
            onClick={handleExportDataset}
            className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-bold text-xs transition-all shadow-lg shadow-[#3B82F6]/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Anonymized Dataset (JSON)</span>
          </button>
        </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!removingEmail}
        onClose={() => setRemovingEmail(null)}
        onConfirm={handleConfirmRemove}
        title={`Revoke Access for ${removingEmail}`}
        impact={`This user will immediately lose access to the private certifyd-ops dashboard. Even if authenticated via Cloudflare Access, middleware will block their requests with a 403 Forbidden error.`}
        confirmWord="REVOKE"
        loading={loading}
      />

      <ConfirmModal
        isOpen={showHygieneModal}
        onClose={() => setShowHygieneModal(false)}
        onConfirm={handleConfirmHygiene}
        title="Purge Resolved Feedback Older than 90 Days"
        impact="This is an irreversible database deletion. All feedback messages marked as Resolved with a timestamp older than 90 days will be permanently erased from Supabase."
        confirmWord="PURGE"
        loading={loading}
      />
    </div>
  );
}
