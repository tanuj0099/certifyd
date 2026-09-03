'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OpsTeamMember, getTeamMembersAction } from '../../actions/opsActions';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { User, Check, ChevronDown, X } from 'lucide-react';

interface AssigneeSelectorProps {
  teamMembers?: OpsTeamMember[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
  currentUserEmail?: string;
  currentUserName?: string;
  isMulti?: boolean;
}

export function AssigneeSelector({
  teamMembers: initialMembers = [],
  value,
  onChange,
  label = 'Assign to Employee',
  className = '',
  placeholder = 'Select Team Member...',
  currentUserEmail,
  currentUserName,
  isMulti = false
}: AssigneeSelectorProps) {
  const { data: liveMembers, setData: setLiveMembers } = useSupabaseRealtime<OpsTeamMember>('ops_team_members', initialMembers);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Merge initialMembers, liveMembers, and currentUser into a deduplicated list
  const map = new Map<string, OpsTeamMember>();

  for (const m of initialMembers) {
    if (m && m.email) map.set(m.email.toLowerCase().trim(), m);
  }

  for (const m of liveMembers) {
    if (m && m.email) map.set(m.email.toLowerCase().trim(), m);
  }

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
  }).sort((a, b) => a.name.localeCompare(b.name));

  const selectedValues = (value || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);

  const selectedMembers = allMembers.filter(m => 
    selectedValues.includes(m.email.toLowerCase()) || selectedValues.includes(m.name.toLowerCase())
  );

  const toggleSelection = (email: string, name: string) => {
    if (!isMulti) {
      onChange(email);
      setIsOpen(false);
      return;
    }
    const cleanEmail = email.toLowerCase();
    if (selectedValues.includes(cleanEmail)) {
      const newValues = selectedValues.filter(v => v !== cleanEmail);
      onChange(newValues.length > 0 ? newValues.join(', ') : 'Unassigned');
    } else {
      const current = selectedValues.includes('unassigned') ? [] : selectedValues;
      onChange([...current, cleanEmail].join(', '));
    }
  };

  const removeMember = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    const cleanEmail = email.toLowerCase();
    const newValues = selectedValues.filter(v => v !== cleanEmail);
    onChange(newValues.length > 0 ? newValues.join(', ') : 'Unassigned');
  };

  return (
    <div className={`w-full relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#F97316]" />
          <span>{label}</span>
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#080A0E] border border-white/10 hover:border-white/20 rounded-xl px-3.5 py-2.5 min-h-[44px] flex items-center justify-between cursor-pointer transition-colors"
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {selectedMembers.length === 0 ? (
            <span className="text-[#8B949E] text-sm">👤 Unassigned / General</span>
          ) : (
            isMulti ? (
              <span className="text-white text-sm font-medium">{selectedMembers.length} Selected</span>
            ) : (
              <span className="text-white text-sm font-medium">{selectedMembers[0].name}</span>
            )
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-[#8B949E] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#161B22] border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden p-1">
          {isMulti && (
            <div 
              className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer text-sm text-[#8B949E]"
              onClick={() => onChange('Unassigned')}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedValues.includes('unassigned') || selectedValues.length === 0 ? 'bg-[#F97316] border-[#F97316] text-[#080A0E]' : 'border-[#8B949E]'}`}>
                {(selectedValues.includes('unassigned') || selectedValues.length === 0) && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>👤 Unassigned / General</span>
            </div>
          )}
          {!isMulti && (
             <div 
              className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer text-sm text-[#8B949E]"
              onClick={() => { onChange('Unassigned'); setIsOpen(false); }}
             >
               <span>👤 Unassigned / General</span>
             </div>
          )}
          {allMembers.map((member) => {
            const isSelected = selectedValues.includes(member.email.toLowerCase()) || selectedValues.includes(member.name.toLowerCase());
            const isMe = currentUserEmail && member.email.toLowerCase() === currentUserEmail.toLowerCase();
            return (
              <div
                key={member.id}
                onClick={() => toggleSelection(member.email, member.name)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
              >
                {isMulti && (
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#F97316] border-[#F97316] text-[#080A0E]' : 'border-[#8B949E] group-hover:border-white'}`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                )}
                <img
                  src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.email)}`}
                  alt={member.name}
                  className="w-6 h-6 rounded-full border border-white/10"
                />
                <div className="flex flex-col">
                  <span className={`text-sm ${isSelected ? 'text-white font-semibold' : 'text-[#8B949E] group-hover:text-white'}`}>
                    {isMe ? '✨ ME: ' : ''}{member.name}
                  </span>
                  <span className="text-[10px] text-[#8B949E] font-mono">{member.role === 'SUPER_ADMIN' ? '👑 Admin' : '💼 Employee'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMembers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedMembers.map(member => (
            <div key={member.id} className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#161B22] border border-white/10 hover:border-white/20 transition-all shadow-sm">
              <img
                src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.email)}`}
                alt={member.name}
                className="w-5 h-5 rounded-full object-cover border border-white/5 bg-[#080A0E]"
              />
              <div className="flex flex-col justify-center">
                <span className="text-white text-xs font-semibold leading-tight">{member.name}</span>
                <span className="text-[#8B949E] text-[9px] font-mono leading-tight">{member.role === 'SUPER_ADMIN' ? 'Admin' : 'Employee'}</span>
              </div>
              {isMulti && (
                <button 
                  onClick={(e) => removeMember(e, member.email)}
                  className="ml-1 p-0.5 rounded-full text-[#8B949E] hover:text-[#F85149] hover:bg-white/5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
