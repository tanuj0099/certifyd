'use client';

import React, { useState, useMemo } from 'react';
import { DemandObservation, addDemandObservationAction, computeDemandScoresAction, pullAdzunaDemandAction } from '@/actions/demandActions';
import { useToast } from '@/components/ui/Toast';
import { Database, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2, Filter, Calendar, CloudDownload } from 'lucide-react';

interface DemandClientProps {
  initialObservations: DemandObservation[];
  userRole?: string;
}

export function DemandClient({ initialObservations, userRole = 'SUPER_ADMIN' }: DemandClientProps) {
  const [observations, setObservations] = useState<DemandObservation[]>(initialObservations || []);
  const [certFilter, setCertFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [adzunaLoading, setAdzunaLoading] = useState(false);
  const { showToast } = useToast();

  // Form state
  const [certName, setCertName] = useState('AWS Certified Solutions Architect - Associate');
  const [city, setCity] = useState('Bengaluru');
  const [role, setRole] = useState('Cloud Solutions Architect');
  const [count, setCount] = useState('45');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Check 90 days manual pull nag
  const hasRecentManualPull = useMemo(() => {
    if (!observations || observations.length === 0) return false;
    const manualPulls = observations.filter((o) => o.source === 'manual_pull');
    if (manualPulls.length === 0) return false;

    const latest = manualPulls.reduce((max, curr) => {
      const currTime = new Date(curr.observed_at || curr.created_at || 0).getTime();
      return currTime > max ? currTime : max;
    }, 0);

    const now = new Date().getTime();
    const daysSince = (now - latest) / (1000 * 60 * 60 * 24);
    return daysSince <= 90;
  }, [observations]);

  const filteredObservations = useMemo(() => {
    return observations.filter((o) => {
      const matchCert = !certFilter || (o.cert_name || '').toLowerCase().includes(certFilter.toLowerCase());
      const matchCity = !cityFilter || (o.city || '').toLowerCase().includes(cityFilter.toLowerCase());
      return matchCert && matchCity;
    });
  }, [observations, certFilter, cityFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newObs: DemandObservation = {
        cert_name: certName.trim(),
        city: city.trim(),
        role: role.trim(),
        open_roles_count: count ? parseInt(count, 10) : null,
        source: 'manual_pull',
        observed_at: date || new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      };

      const res = await addDemandObservationAction(newObs);
      if (res.success && res.data) {
        setObservations((prev) => [res.data, ...prev]);
        showToast('Demand observation logged and scores computed!', 'success');
        setNotes('');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to log observation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComputeScores = async () => {
    setScoringLoading(true);
    try {
      const res = await computeDemandScoresAction();
      showToast(`Computed normalized demand scores for ${res.count || 0} combinations.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to compute demand scores', 'error');
    } finally {
      setScoringLoading(false);
    }
  };

  const handleAdzunaPull = async () => {
    setAdzunaLoading(true);
    try {
      const res = await pullAdzunaDemandAction();
      showToast(`Pulled ${res.count || 0} job observations from Adzuna API and recomputed scores.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Adzuna API pull failed (check ADZUNA_APP_ID/KEY envs)', 'error');
    } finally {
      setAdzunaLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 90-Day Quarterly Reminder Nag Banner (A1) */}
      {!hasRecentManualPull ? (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-200">Quarterly Demand Pull Required (&gt;90 Days Stale)</h4>
            <p className="text-amber-300/90 leading-relaxed">
              No <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-amber-200">manual_pull</code> demand observation has been logged in the last 90 days. Please verify high-confidence job listings on Naukri/LinkedIn and log fresh manual counts below to maintain live data honesty.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Manual demand data is fresh (<code className="font-mono bg-black/20 px-1 rounded">manual_pull</code> recorded within the last 90 days).</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-400" />
            Market Demand Observations
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Log real job demand observations and compute normalized 0–100 scores (`demand_scores`) with honest confidence signals.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAdzunaPull}
            disabled={adzunaLoading || scoringLoading}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#161B22] hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition disabled:opacity-50"
          >
            <CloudDownload className={`w-3.5 h-3.5 ${adzunaLoading ? 'animate-bounce' : ''}`} />
            <span>{adzunaLoading ? 'Pulling Adzuna...' : 'Trigger Adzuna Pull'}</span>
          </button>
          <button
            onClick={handleComputeScores}
            disabled={scoringLoading || adzunaLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scoringLoading ? 'animate-spin' : ''}`} />
            <span>{scoringLoading ? 'Computing Scores...' : 'Recompute Demand Scores'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel (A1) */}
        <div className="bg-[#0F1218] border border-white/10 rounded-2xl p-5 space-y-4 lg:col-span-1 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Plus className="w-4 h-4" />
            <span>Log Manual Observation</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Certification Name</label>
              <input
                type="text"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                required
                className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-medium mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="e.g. Bengaluru"
                  className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Observed Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Role / Job Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                placeholder="e.g. Cloud Solutions Architect"
                className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Open Roles Count</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  min="0"
                  required
                  className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Source</label>
                <input
                  type="text"
                  value="manual_pull"
                  disabled
                  className="w-full bg-[#161B22]/50 border border-white/5 rounded-xl px-3 py-2 text-gray-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Notes / Verification URL (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Verified via Naukri search filter for 5-8 yrs exp..."
                className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold transition disabled:opacity-50 shadow-md shadow-indigo-600/20 mt-2"
            >
              {loading ? 'Logging Observation...' : 'Log Observation & Score'}
            </button>
          </form>
        </div>

        {/* Table View Panel (A1) */}
        <div className="bg-[#0F1218] border border-white/10 rounded-2xl p-5 space-y-4 lg:col-span-2 shadow-xl flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Observed Job Counts ({filteredObservations.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by cert..."
                  value={certFilter}
                  onChange={(e) => setCertFilter(e.target.value)}
                  className="bg-[#161B22] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-36"
                />
              </div>
              <div className="relative">
                <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by city..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-[#161B22] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-32"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-xl flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 font-medium">
                  <th className="py-2.5 px-3">Certification</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Count</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Observed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredObservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No demand observations logged matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredObservations.map((obs, idx) => (
                    <tr key={obs.id || idx} className="hover:bg-white/[0.02] transition">
                      <td className="py-2.5 px-3 font-medium text-white">{obs.cert_name}</td>
                      <td className="py-2.5 px-3 text-gray-300">{obs.city}</td>
                      <td className="py-2.5 px-3 text-gray-300">{obs.role}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{obs.open_roles_count ?? '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full ${
                          obs.source === 'manual_pull'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : obs.source === 'adzuna_api'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {obs.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 font-mono">{obs.observed_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
