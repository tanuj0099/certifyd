'use client';

import React, { useState, useEffect } from 'react';
import { OpsTeamMember, getTeamMembersAction } from '../../actions/opsActions';
import { User } from 'lucide-react';

interface AssigneeSelectorProps {
  teamMembers?: OpsTeamMember[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
  currentUserEmail?: string;
  currentUserName?: string;
}

export function AssigneeSelector({
  teamMembers: initialMembers = [],
  value,
  onChange,
  label = 'Assign to Employee',
  className = '',
  placeholder = 'Select Team Member...',
  currentUserEmail,
  currentUserName
}: AssigneeSelectorProps) {
  const [liveMembers, setLiveMembers] = useState<OpsTeamMember[]>(initialMembers);

  useEffect(() => {
    let isMounted = true;
    async function syncMembers() {
      try {
        const latest = await getTeamMembersAction();
        if (isMounted && latest && Array.isArray(latest)) {
          setLiveMembers(latest);
        }
      } catch (e) {}
    }
    syncMembers();
    const interval = setInterval(syncMembers, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Merge initialMembers, liveMembers, and currentUser into a deduplicated list
  const map = new Map<string, OpsTeamMember>();

  // 1. First populate from initialMembers prop
  for (const m of initialMembers) {
    if (m && m.email) map.set(m.email.toLowerCase().trim(), m);
  }

  // 2. Override/enrich with live polling members
  for (const m of liveMembers) {
    if (m && m.email) map.set(m.email.toLowerCase().trim(), m);
  }

  // 3. Ensure current logged in user/employee is always present (unless it is default system admin)
  if (currentUserEmail && !currentUserEmail.toLowerCase().includes('admin@certifyd.in') && !currentUserEmail.toLowerCase().includes('superadmin@certifyd.in')) {
    const cleanCurrentEmail = currentUserEmail.toLowerCase().trim();
    if (!map.has(cleanCurrentEmail)) {
      map.set(cleanCurrentEmail, {
        id: `current-user-${cleanCurrentEmail}`,
        email: cleanCurrentEmail,
        name: currentUserName || cleanCurrentEmail.split('@')[0] || 'Current Employee',
        role: cleanCurrentEmail === 'tanuj@certifyd.in' ? 'SUPER_ADMIN' : 'TEAM_MEMBER',
        permissions: {
          access_marketing: true,
          access_technical: true,
          access_database: true,
          access_verifications: true,
          access_content: true,
          access_admin: true,
        },
        status: 'active',
        created_at: new Date().toISOString(),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanCurrentEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      });
    }
  }

  const allMembers = Array.from(map.values()).filter((m) => {
    const clean = m.email.toLowerCase().trim();
    const cleanName = m.name.toLowerCase().trim();
    if (clean === 'admin@certifyd.in' || clean === 'superadmin@certifyd.in' || cleanName === 'super admin' || (m.role === 'SUPER_ADMIN' && clean.includes('admin'))) {
      return false;
    }
    return true;
  });

  const selectedMember = allMembers.find(
    (m) => m.email.toLowerCase() === (value || '').toLowerCase() || m.name.toLowerCase() === (value || '').toLowerCase()
  );

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#F97316]" />
          <span>{label}</span>
        </label>
      )}
      <div className="relative">
        <select
          value={value || 'Unassigned'}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F97316] transition-colors appearance-none pr-9 cursor-pointer font-medium"
        >
          <option value="Unassigned">👤 Unassigned / General</option>
          {allMembers.map((member) => {
            const isMe = currentUserEmail && member.email.toLowerCase() === currentUserEmail.toLowerCase();
            return (
              <option key={member.id} value={member.email}>
                {isMe ? '✨ ME: ' : ''}{member.name} ({member.email}) - {member.role === 'SUPER_ADMIN' ? '👑 Admin' : '💼 Employee'}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#8B949E]">
          <span className="text-[10px] font-mono">▼</span>
        </div>
      </div>
      {selectedMember && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono">
          <img
            src={selectedMember.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedMember.email)}`}
            alt={selectedMember.name}
            className="w-5 h-5 rounded-full object-cover border border-white/10 bg-[#080A0E]"
          />
          <span className="text-white font-medium">{selectedMember.name}</span>
          <span className="text-[#8B949E] text-[11px]">({selectedMember.email})</span>
          <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
            selectedMember.role === 'SUPER_ADMIN'
              ? 'bg-[#F97316]/15 text-[#F97316]'
              : 'bg-[#00D4A8]/15 text-[#00D4A8]'
          }`}>
            {selectedMember.role === 'SUPER_ADMIN' ? 'Admin' : 'Employee'}
          </span>
        </div>
      )}
    </div>
  );
}
