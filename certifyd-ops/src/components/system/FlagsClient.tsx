'use client';

import React, { useState } from 'react';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toggleFeatureFlagAction } from '../../actions/systemActions';
import { ToggleRight, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, Globe, Database, Shield } from 'lucide-react';

export interface FlagRecord {
  flag_key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  updated_by: string;
  updated_at: string;
  icon?: string;
}

export function FlagsClient({ initialFlags }: { initialFlags: FlagRecord[] }) {
  const [flags, setFlags] = useState<FlagRecord[]>(initialFlags);
  const [targetFlag, setTargetFlag] = useState<{ key: string; name: string; targetState: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleConfirmToggle() {
    if (!targetFlag) return;
    setLoading(true);
    try {
      await toggleFeatureFlagAction(targetFlag.key, targetFlag.targetState);
      setFlags((prev) =>
        prev.map((f) =>
          f.flag_key === targetFlag.key
            ? { ...f, is_enabled: targetFlag.targetState, updated_by: 'current_admin', updated_at: new Date().toISOString() }
            : f
        )
      );
      showToast(`Flag "${targetFlag.name}" turned ${targetFlag.targetState ? 'ON 🟢' : 'OFF 🔴'} ✓`, 'success');
      setTargetFlag(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle flag', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#F97316]/15 text-[#F97316] text-[10px] font-mono font-bold uppercase">
              SUPER ADMIN ONLY
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Feature Flags</h1>
          </div>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Real-time runtime switches controlling AI engines, PII strictness, and live scraper jobs on certifyd.in
          </p>
        </div>
      </div>

      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#161B22]/60 text-[#8B949E] font-mono uppercase tracking-wider">
                <th className="py-3.5 px-6 font-medium">FLAG NAME & KEY</th>
                <th className="py-3.5 px-4 font-medium">DESCRIPTION</th>
                <th className="py-3.5 px-4 font-medium">LAST CHANGED BY</th>
                <th className="py-3.5 px-4 font-medium">TIMESTAMP</th>
                <th className="py-3.5 px-6 font-medium text-right">STATUS (TOGGLE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {flags.map((flag) => {
                const isMaintenance = flag.flag_key === 'maintenance_mode';

                return (
                  <tr
                    key={flag.flag_key}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isMaintenance && flag.is_enabled ? 'bg-[#F85149]/10' : ''
                    }`}
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isMaintenance
                              ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30'
                              : 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30'
                          }`}
                        >
                          {flag.flag_key === 'enable_ai_analyzer' && <Cpu className="w-4 h-4" />}
                          {flag.flag_key === 'enable_pii_strict' && <Shield className="w-4 h-4" />}
                          {flag.flag_key === 'maintenance_mode' && <ShieldAlert className="w-4 h-4 animate-pulse" />}
                          {flag.flag_key === 'enable_counter_offers' && <Globe className="w-4 h-4" />}
                          {flag.flag_key === 'enable_live_scraping' && <Database className="w-4 h-4" />}
                          {!['enable_ai_analyzer', 'enable_pii_strict', 'maintenance_mode', 'enable_counter_offers', 'enable_live_scraping'].includes(flag.flag_key) && (
                            <ToggleRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white font-mono">{flag.name}</p>
                          <p className="text-[11px] text-[#8B949E] font-mono mt-0.5">{flag.flag_key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-[#F0F6FC] max-w-md leading-relaxed">{flag.description}</td>
                    <td className="py-5 px-4 text-[#F97316] font-mono">{flag.updated_by}</td>
                    <td className="py-5 px-4 text-[#8B949E] font-mono">{new Date(flag.updated_at).toLocaleString()}</td>
                    <td className="py-5 px-6 text-right">
                      <button
                        onClick={() =>
                          setTargetFlag({
                            key: flag.flag_key,
                            name: flag.name,
                            targetState: !flag.is_enabled,
                          })
                        }
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all shadow-md ${
                          flag.is_enabled
                            ? isMaintenance
                              ? 'bg-[#F85149] text-white shadow-[#F85149]/30 animate-pulse'
                              : 'bg-[#22C55E] text-[#080A0E] shadow-[#22C55E]/20'
                            : 'bg-[#161B22] border border-white/20 text-[#8B949E] hover:text-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${flag.is_enabled ? 'bg-current' : 'bg-[#8B949E]'}`} />
                        <span>{flag.is_enabled ? 'ENABLED 🟢' : 'DISABLED ⚪'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!targetFlag}
        onClose={() => setTargetFlag(null)}
        onConfirm={handleConfirmToggle}
        title={`Confirm Toggle: "${targetFlag?.name}"`}
        impact={`You are about to turn ${targetFlag?.targetState ? 'ON' : 'OFF'} the "${targetFlag?.key}" feature flag. This will instantly change runtime behavior for all active users across certifyd.in without a redeployment.`}
        confirmWord="CONFIRM"
        loading={loading}
      />
    </div>
  );
}
