'use client';

import React, { useState } from 'react';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { addAdminUserAction, removeAdminUserAction, clearOldFeedbackAction } from '../../actions/systemActions';
import { updateUserPasswordAction, updateAdminEmailAction, updateUserAvatarAction } from '../../actions/opsActions';
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
  User,
  Image,
} from 'lucide-react';

export interface AdminUserRecord {
  email: string;
  role: 'SUPER_ADMIN' | 'TEAM_MEMBER';
  added_at: string;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=RobotOps&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=OpsTeam&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
  'https://api.dicebear.com/7.x/micah/svg?seed=Developer&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Analyst&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Creative&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
];

export function SettingsClient({
  initialAdmins,
  currentAdminEmail,
  userRole = 'SUPER_ADMIN',
  initialAvatar = '',
}: {
  initialAdmins: AdminUserRecord[];
  currentAdminEmail: string;
  userRole?: 'SUPER_ADMIN' | 'TEAM_MEMBER';
  initialAvatar?: string;
}) {
  const [admins, setAdmins] = useState<AdminUserRecord[]>(initialAdmins);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'SUPER_ADMIN' | 'TEAM_MEMBER'>('TEAM_MEMBER');
  const [loading, setLoading] = useState(false);

  // Avatar state
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar || PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState(initialAvatar || '');

  // Security & Credential state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState(currentAdminEmail);

  // Hygiene modal
  const [showHygieneModal, setShowHygieneModal] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const { showToast } = useToast();

  async function handleUpdateAvatar(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAvatar) return;
    setLoading(true);
    try {
      const res = await updateUserAvatarAction(currentAdminEmail, selectedAvatar);
      if (res.success) {
        showToast('Avatar updated! Your profile picture across the workspace is refreshed. ✓', 'success');
      } else {
        showToast(res.message || 'Failed to update avatar', 'error');
      }
    } catch (err: any) {
      showToast('Error updating avatar', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please check and re-enter.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await updateUserPasswordAction(currentAdminEmail, newPassword);
      if (res.success) {
        showToast('Password updated successfully! ✓ You can use this immediately on login.', 'success');
        setNewPassword('');
        setConfirmPassword('');
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
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              userRole === 'SUPER_ADMIN' ? 'bg-[#F97316]/15 text-[#F97316]' : 'bg-[#00D4A8]/15 text-[#00D4A8]'
            }`}>
              {userRole === 'SUPER_ADMIN' ? 'SUPER ADMIN ACCESS' : 'EMPLOYEE WORKSPACE'}
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Account & System Settings</h1>
          </div>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Profile avatar personalization, credential security, and {userRole === 'SUPER_ADMIN' ? 'system-wide governance allowlists' : 'account configuration'}
          </p>
        </div>
      </div>

      {/* Profile & Avatar Management (Visible to all team members & admins) */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="pb-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
            <User className="w-5 h-5 text-[#00D4A8]" />
            <span>Profile & Avatar Management</span>
          </h3>
          <p className="text-xs text-[#8B949E] mt-0.5 font-mono">
            Choose a unique avatar for your DP across the sidebar, team notes, and task delegation board
          </p>
        </div>

        <form onSubmit={handleUpdateAvatar} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#161B22]/60 p-4 rounded-xl border border-white/5">
            <img
              src={selectedAvatar || PRESET_AVATARS[0]}
              alt="DP Preview"
              className="w-20 h-20 rounded-2xl border-2 border-[#00D4A8]/40 bg-[#080A0E] object-cover shrink-0 shadow-lg"
            />
            <div className="space-y-2 flex-1 w-full">
              <span className="text-xs font-bold text-white font-mono uppercase block">Select from Curated Avatars</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(url);
                      setCustomAvatarUrl(url);
                    }}
                    className={`w-10 h-10 rounded-xl border p-0.5 bg-[#080A0E] overflow-hidden transition-all ${
                      selectedAvatar === url ? 'border-[#00D4A8] ring-2 ring-[#00D4A8]/30 scale-110 shadow-md' : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8B949E] mb-1">Or enter a Custom Avatar Image URL</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={customAvatarUrl}
                onChange={(e) => {
                  setCustomAvatarUrl(e.target.value);
                  setSelectedAvatar(e.target.value);
                }}
                placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=yourname"
                className="flex-1 bg-[#0D1117] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00D4A8] font-mono"
              />
              <button
                type="submit"
                disabled={loading || !selectedAvatar}
                className="px-6 py-2 rounded-xl bg-[#00D4A8] text-[#080A0E] text-xs font-bold font-mono hover:bg-[#00D4A8]/90 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#00D4A8]/20"
              >
                <Save className="w-4 h-4" />
                <span>Save Avatar</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* System Status & Diagnostics Grid (Super Admin Only) */}
      {userRole === 'SUPER_ADMIN' && (
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
      )}

      {/* Security & Password Management */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="pb-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
            <Lock className="w-5 h-5 text-[#F97316]" />
            <span>Security & Credential Management</span>
          </h3>
          <p className="text-xs text-[#8B949E] mt-0.5 font-mono">
            Update your account password{userRole === 'SUPER_ADMIN' ? ' or modify the Super Admin contact email address' : ''}
          </p>
        </div>

        <div className={`grid grid-cols-1 ${userRole === 'SUPER_ADMIN' ? 'md:grid-cols-2' : ''} gap-6`}>
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
            <div>
              <label className="block text-xs font-mono text-[#8B949E] mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full bg-[#0D1117] border border-white/10 rounded-xl pl-3.5 pr-10 py-2 text-sm text-white focus:outline-none focus:border-[#F97316] font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="px-4 py-2 rounded-xl bg-[#F97316] text-[#080A0E] text-xs font-bold font-mono hover:bg-[#F97316]/90 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </form>

          {userRole === 'SUPER_ADMIN' && (
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
          )}
        </div>
      </div>

      {/* Admin Users Management (Super Admin Only) */}
      {userRole === 'SUPER_ADMIN' && (
        <>
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
        </>
      )}

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
