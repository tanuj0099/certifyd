'use client';

import React, { useState } from 'react';
import { OpsTeamMember, saveTeamMemberAction, deleteTeamMemberAction, createEmployeeProfileAction, updateUserPasswordAction } from '../../actions/opsActions';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  AlertTriangle,
  Mail,
  User,
  Search,
  Check,
  X,
  Copy,
  Key,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamClientProps {
  initialTeam: OpsTeamMember[];
  currentUserRole: string;
  currentUserEmail: string;
}

export function TeamClient({ initialTeam, currentUserRole, currentUserEmail }: TeamClientProps) {
  const [team, setTeam] = useState<OpsTeamMember[]>(initialTeam || []);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (initialTeam) setTeam(initialTeam);
  }, [initialTeam]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'SUPER_ADMIN' | 'TEAM_MEMBER'>('TEAM_MEMBER');
  const [newPermissions, setNewPermissions] = useState({
    access_marketing: false,
    access_technical: false,
    access_database: false,
    access_verifications: true,
    access_content: true,
    access_admin: false,
  });
  const [generatedCreds, setGeneratedCreds] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetMember, setResetMember] = useState<OpsTeamMember | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const { showToast } = useToast();
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const filteredTeam = (team || []).filter((m) => {
    if (!m) return false;
    const q = searchQuery.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) ||
           (m.email || '').toLowerCase().includes(q);
  });

  async function handleTogglePermission(member: OpsTeamMember, permKey: keyof OpsTeamMember['permissions']) {
    if (!isSuperAdmin) {
      showToast('Only Super Admins can modify access permissions.', 'error');
      return;
    }

    const updatedPermissions = {
      ...member.permissions,
      [permKey]: !member.permissions[permKey]
    };

    const updatedMember: OpsTeamMember = {
      ...member,
      permissions: updatedPermissions
    };

    setTeam((prev) => prev.map((m) => (m.id === member.id ? updatedMember : m)));
    setIsSaving((prev) => ({ ...prev, [member.id]: true }));

    try {
      await saveTeamMemberAction(updatedMember);
      showToast(`Updated access permissions for ${member.name}`, 'success');
    } catch (e) {
      showToast('Failed to save permissions to database.', 'error');
    } finally {
      setIsSaving((prev) => ({ ...prev, [member.id]: false }));
    }
  }

  async function handleToggleStatus(member: OpsTeamMember) {
    if (!isSuperAdmin) {
      showToast('Only Super Admins can suspend or activate team members.', 'error');
      return;
    }

    if (member.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      showToast('You cannot suspend your own Super Admin account.', 'error');
      return;
    }

    const updatedMember: OpsTeamMember = {
      ...member,
      status: member.status === 'active' ? 'suspended' : 'active'
    };

    setTeam((prev) => prev.map((m) => (m.id === member.id ? updatedMember : m)));
    await saveTeamMemberAction(updatedMember);
    showToast(`Member ${updatedMember.name} is now ${updatedMember.status}`, 'success');
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const res = await createEmployeeProfileAction(newName, newPermissions);
    if (res.success) {
      setTeam((prev) => [...prev, res.member]);
      setIsAddModalOpen(false);
      setNewName('');
      setGeneratedCreds({ name: res.member.name, email: res.email, tempPassword: res.tempPassword });
      showToast(`Created employee profile for ${res.member.name}!`, 'success');
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const member = team.find((m) => m.id === deleteId);
    if (member && member.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      showToast('You cannot delete your own Super Admin account.', 'error');
      setDeleteId(null);
      return;
    }

    setTeam((prev) => prev.filter((m) => m.id !== deleteId));
    setDeleteId(null);
    await deleteTeamMemberAction(deleteId!);
    showToast('Removed team member.', 'success');
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetMember || !resetPassword.trim()) return;

    const targetEmail = resetMember.email;
    const targetName = resetMember.name;
    setIsResetting(true);
    try {
      const res = await updateUserPasswordAction(targetEmail, resetPassword);
      if (res.success) {
        showToast(`Reset password for ${targetName}!`, 'success');
        setTeam((prev) => prev.map((m) => (m.id === resetMember.id ? { ...m, temp_password: resetPassword } : m)));
        setResetMember(null);
        setGeneratedCreds({ name: targetName, email: targetEmail, tempPassword: resetPassword });
      } else {
        showToast(res.message || 'Failed to update password.', 'error');
      }
    } catch (err) {
      showToast('Error resetting password.', 'error');
    } finally {
      setIsResetting(false);
    }
  }

  const permLabels: { key: keyof OpsTeamMember['permissions']; label: string; icon: string; desc: string }[] = [
    { key: 'access_verifications', label: 'Verifications', icon: '🛡️', desc: 'Resume uploads & offer letter reviews' },
    { key: 'access_database', label: 'Database', icon: '🗄️', desc: 'Certifications & market job staging benchmarks' },
    { key: 'access_marketing', label: 'Marketing', icon: '📈', desc: 'Growth campaigns & salary lift ROI content' },
    { key: 'access_technical', label: 'Technical', icon: '⚙️', desc: 'API parsers, rate limiters & system health' },
    { key: 'access_content', label: 'Content & Support', icon: '💬', desc: 'User feedback & contact form inquiries' },
    { key: 'access_admin', label: 'Super Admin', icon: '👑', desc: 'Full access to team permissions & audit logs' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#F97316]" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Dynamic Team RBAC & Access Control</h1>
          </div>
          <p className="text-sm text-[#8B949E] mt-1 font-mono">
            Granularly grant or revoke real-time operational access for each employee across departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team..."
              className="bg-[#161B22] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-[#8B949E] focus:outline-none focus:border-[#F97316] w-64"
            />
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-[#080A0E] font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#F97316]/10"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="p-4 rounded-xl bg-[#E8C547]/10 border border-[#E8C547]/30 flex items-center gap-3 text-[#E8C547]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-mono">
            You are logged in as a Team Member. Only Super Admins can modify granular department permissions.
          </span>
        </div>
      )}

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredTeam.map((member) => {
            const isMe = member.email.toLowerCase() === currentUserEmail.toLowerCase();
            const isMemberSuperAdmin = member.role === 'SUPER_ADMIN';

            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-[#0D1117] border rounded-2xl p-6 transition-all relative overflow-hidden ${
                  member.status === 'suspended'
                    ? 'border-[#F85149]/30 opacity-75 bg-[#0D1117]/50'
                    : isMemberSuperAdmin
                    ? 'border-[#F97316]/40 shadow-xl shadow-[#F97316]/5'
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                {/* Top bar of card */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 ${
                      isMemberSuperAdmin
                        ? 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30'
                        : 'bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30'
                    }`}>
                      <img
                        src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                        alt={member.name}
                        className="w-full h-full object-cover bg-[#080A0E]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{member.name}</h3>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono font-semibold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#8B949E] font-mono mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider flex items-center gap-1 ${
                      member.status === 'active'
                        ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                        : 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30'
                    }`}>
                      {member.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {member.status}
                    </span>

                    {isSuperAdmin && !isMe && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8B949E] hover:text-white transition-colors"
                          title={member.status === 'active' ? 'Suspend Access' : 'Activate Access'}
                        >
                          {member.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setResetMember(member);
                            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                            let pass = 'Cert#';
                            for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                            setResetPassword(pass);
                          }}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-[#F97316]/20 text-[#8B949E] hover:text-[#F97316] transition-colors"
                          title="Reset & View Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(member.id)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-[#F85149]/20 text-[#8B949E] hover:text-[#F85149] transition-colors"
                          title="Remove Team Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Role description banner */}
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs font-mono font-semibold uppercase ${
                    isMemberSuperAdmin ? 'text-[#F97316]' : 'text-[#3B82F6]'
                  }`}>
                    {isMemberSuperAdmin ? '⚡ SUPER ADMIN (FULL PRIVILEGES)' : '👥 OPERATIONS TEAM MEMBER'}
                  </span>
                  {isSaving[member.id] && (
                    <span className="text-[11px] text-[#F97316] animate-pulse font-mono flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved to Supabase
                    </span>
                  )}
                </div>

                {/* Permissions Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {permLabels.map(({ key, label, icon, desc }) => {
                    const hasPerm = member.permissions[key];
                    const isDisabled = !isSuperAdmin || (isMemberSuperAdmin && key === 'access_admin');

                    return (
                      <div
                        key={key}
                        onClick={() => !isDisabled && handleTogglePermission(member, key)}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-2 select-none ${
                          isDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-white/20'
                        } ${
                          hasPerm
                            ? 'bg-[#F97316]/[0.06] border-[#F97316]/30'
                            : 'bg-[#161B22]/50 border-white/[0.04] opacity-60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{icon}</span>
                            <span className={`text-xs font-bold truncate ${hasPerm ? 'text-white' : 'text-[#8B949E]'}`}>
                              {label}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#8B949E] mt-0.5 line-clamp-1">{desc}</p>
                        </div>

                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          hasPerm ? 'bg-[#F97316] text-[#080A0E]' : 'bg-white/10 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D1117] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#F97316]" />
                  <span>Add Team Member</span>
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Employee Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                  />
                  <p className="text-[11px] text-[#8B949E] mt-1">
                    An official email address and temporary random password will be automatically generated.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase mb-2">Assign Department Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'access_verifications', label: 'Verifications' },
                      { key: 'access_content', label: 'Content' },
                      { key: 'access_technical', label: 'Technical' },
                      { key: 'access_database', label: 'Database' },
                      { key: 'access_marketing', label: 'Marketing' },
                      { key: 'access_admin', label: 'Admin Access' },
                    ].map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-[#161B22] border border-white/10 cursor-pointer hover:border-white/20 select-none text-xs text-white"
                      >
                        <input
                          type="checkbox"
                          checked={(newPermissions as any)[perm.key]}
                          onChange={(e) =>
                            setNewPermissions((prev) => ({ ...prev, [perm.key]: e.target.checked }))
                          }
                          className="rounded border-white/20 bg-black text-[#F97316] focus:ring-0"
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sm font-semibold text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-[#080A0E] font-bold text-sm transition-all"
                  >
                    Generate Profile & Credentials
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generated Credentials Modal */}
      <AnimatePresence>
        {generatedCreds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0D1117] border border-[#F97316]/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Employee Onboarding Credentials</h3>
                  <p className="text-xs text-[#8B949E]">Profile created for {generatedCreds.name}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 bg-[#161B22] p-4 rounded-xl border border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8B949E] block">Generated Email</span>
                  <div className="flex items-center justify-between font-mono text-sm text-white mt-0.5">
                    <span>{generatedCreds.email}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCreds.email);
                        showToast('Copied email!', 'success');
                      }}
                      className="text-[#8B949E] hover:text-white p-1"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase text-[#8B949E] block">Temporary Password</span>
                  <div className="flex items-center justify-between font-mono text-sm text-[#F97316] font-bold mt-0.5">
                    <span>{generatedCreds.tempPassword}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCreds.tempPassword);
                        showToast('Copied password!', 'success');
                      }}
                      className="text-[#8B949E] hover:text-white p-1"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase text-[#8B949E] block">Portal Login URL</span>
                  <div className="font-mono text-xs text-[#8B949E] mt-0.5 truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#8B949E] mt-4 leading-relaxed">
                <span className="text-white font-semibold">Next Step:</span> Send these credentials to {generatedCreds.name}. They can log into their portal and change their password anytime from their account settings.
              </p>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setGeneratedCreds(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-[#080A0E] font-bold text-sm transition-all"
                >
                  Done & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161B22] border border-white/[0.1] rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setResetMember(null)}
                className="absolute right-4 top-4 text-[#8B949E] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs font-mono text-[#8B949E]">{resetMember.name} ({resetMember.email})</p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#8B949E] mb-1">New Temporary Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="e.g. Cert#xYz123"
                      className="flex-1 bg-[#0D1117] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#F97316] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                        let pass = 'Cert#';
                        for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                        setResetPassword(pass);
                      }}
                      className="px-3 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] rounded-xl text-xs font-mono text-[#8B949E] hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> Gen
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8B949E] mt-1.5 leading-relaxed">
                    Set any password above or click <span className="text-[#F97316] font-semibold">Gen</span> for a random one. When updated, you can instantly copy and share the credentials.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetMember(null)}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sm text-[#8B949E] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting || !resetPassword.trim()}
                    className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-[#080A0E] font-bold text-sm transition-all disabled:opacity-50"
                  >
                    {isResetting ? 'Saving...' : 'Update & View Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Remove Team Member?"
        impact="Are you sure you want to remove this employee from the ops dashboard? Their access will be revoked immediately."
        confirmWord="REMOVE"
      />
    </div>
  );
}
