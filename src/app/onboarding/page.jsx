'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase.js';
import { upsertUserProfile, updateUserAvatar } from '@/services/userProfileService.js';
import { useAuth } from '@/hooks/useAuth.jsx';
import { AvatarSelector } from '@/components/AnimatedAvatar.jsx';
import { 
  CheckCircle2, Sparkles, Target, Briefcase, DollarSign, 
  Clock, Flame, MapPin, Building, ArrowRight, ArrowLeft 
} from 'lucide-react';

const FS = "var(--font-sans)";
const FM = "var(--font-mono)";

const AVATAR_COLORS = [
  { bg: '#1a2e1a', text: '#2db87a' },
  { bg: '#1a1a2e', text: '#7c6af4' },
  { bg: '#2e1a1a', text: '#f47c6a' },
  { bg: '#2e261a', text: '#f4c06a' },
  { bg: '#1a2a2e', text: '#6ab8f4' },
];

const CAREER_FOCUSES = [
  'Student / Fresh Grad',
  'Software Engineer',
  'Cloud & DevOps Engineer',
  'Data & AI Engineer',
  'Product & Design',
  'Cybersecurity Specialist',
  'Finance / FinTech Pro',
  'Engineering Leadership',
];

const TARGET_DOMAINS = [
  'Cloud & AI Infrastructure',
  'FinTech & Banking',
  'SaaS & Enterprise',
  'Cybersecurity & Infosec',
  'E-commerce & Consumer Tech',
  'HealthTech & Bio',
  'AI / Machine Learning',
  'Web3 / Decentralized Systems',
];

const CITIES = [
  'Bangalore',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Remote / Global',
];

const SALARY_BANDS = [
  'Student / ₹0',
  '< ₹10L PA',
  '₹10L – ₹20L PA',
  '₹20L – ₹35L PA',
  '₹35L – ₹50L PA',
  '₹50L – ₹80L PA',
  '₹80L+ PA',
];

const SALARY_GOALS = [
  { label: '+30% Annual Hike Goal', desc: 'Accelerate within my current career trajectory' },
  { label: '+50% Aggressive Growth', desc: 'Level up with strategic certifications & switch' },
  { label: '2x Salary Jump', desc: 'Pivot into high-paying Cloud/AI/Fintech roles' },
  { label: 'Global Remote / Dollar Pay', desc: 'Secure top-tier remote opportunities worldwide' },
  { label: 'Leadership / Staff Promotion', desc: 'Transition to Staff Engineer or Management' },
  { label: 'Break into Big Tech (FAANG)', desc: 'Master system design and algorithmic readiness' },
];

const WEEKLY_COMMITMENTS = [
  { label: '2–4 hrs / week', desc: 'Casual upskilling alongside full-time work', badge: 'Steady' },
  { label: '5–10 hrs / week', desc: 'Dedicated career switch & certification track', badge: 'Recommended' },
  { label: '10–20 hrs / week', desc: 'Aggressive bootcamp intensity for rapid leap', badge: 'Intense' },
];

const MOTIVATIONS = [
  'Break into Tech / New Domain',
  'Crack Top-Tier / FAANG Interviews',
  'Master Cloud & AI Certifications',
  'Overcome Career Stagnation / Plateau',
  'Build High-ROI Portfolio Projects',
];

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function Onboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 0: Workspace Identity
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [city, setCity] = useState('Bangalore');

  // Step 1: Role & Domain
  const [careerFocus, setCareerFocus] = useState('Software Engineer');
  const [targetDomain, setTargetDomain] = useState('Cloud & AI Infrastructure');

  // Step 2: Compensation & Goals
  const [currentSalaryBand, setCurrentSalaryBand] = useState('₹10L – ₹20L PA');
  const [targetSalaryGoal, setTargetSalaryGoal] = useState('+50% Aggressive Growth');

  // Step 3: Commitment & Style
  const [weeklyHours, setWeeklyHours] = useState('5–10 hrs / week');
  const [motivation, setMotivation] = useState('Master Cloud & AI Certifications');

  // Step 4: Avatar Selection
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);

  const totalSteps = 5;
  const progressPercent = Math.round(((step + 1) / totalSteps) * 100);

  const initials = (() => {
    if (!user) return '?';
    const name = user.displayName || user.email || '';
    const parts = name.split(/[\s@]/);
    return parts[0]?.[0]?.toUpperCase() || '?';
  })();

  useEffect(() => {
    if (!slugManual) {
      setWorkspaceSlug(slugify(workspaceName));
    }
  }, [workspaceName, slugManual]);

  useEffect(() => {
    if (user && !workspaceName) {
      const name = user.displayName || '';
      if (name) setWorkspaceName(name);
    }
  }, [user]);

  async function handleComplete() {
    setSubmitting(true);
    setError('');
    try {
      const { data: { user: activeUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !activeUser) {
        throw new Error('No authenticated session found. Please sign in again.');
      }

      const provider = activeUser.app_metadata?.provider || 'password';

      // Upsert into user_profiles via our enriched service
      await upsertUserProfile(activeUser, {
        email: activeUser.email || user?.email || '',
        full_name: workspaceName.trim() || activeUser.user_metadata?.full_name || user?.displayName || '',
        avatar_url: activeUser.user_metadata?.avatar_url || user?.photoURL || '',
        job_role: careerFocus || 'Software Engineer',
        city: city || 'Bangalore',
        current_salary_band: currentSalaryBand || '',
        target_domain: targetDomain || '',
        target_salary_goal: targetSalaryGoal || '',
        weekly_hours: weeklyHours || '',
        motivation: motivation || '',
        onboarding_complete: true,
        provider,
      });

      if (selectedAvatarId) {
        await updateUserAvatar(user, selectedAvatarId);
      }

      // Also upsert into profiles table for backward compatibility
      if (supabase) {
        const profileData = {
          id: activeUser.id,
          email: activeUser.email,
          workspace_name: workspaceName.trim() || 'My Workspace',
          workspace_slug: workspaceSlug.trim() || slugify(workspaceName) || activeUser.id,
          career_focus: careerFocus || 'Software Engineer',
          city: city || 'Bangalore',
          avatar_initials: initials,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        };
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });
        if (profileError) console.warn('profiles compatibility upsert warning:', profileError.message);
      }

      router.push('/dashboard', { replace: true });
    } catch (err) {
      console.error('Onboarding save failed:', err);
      setError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvanceStep0 = workspaceName.trim().length >= 2 && /^[a-z0-9-]+$/.test(workspaceSlug) && !!city;
  const canAdvanceStep1 = !!careerFocus && !!targetDomain;
  const canAdvanceStep2 = !!currentSalaryBand && !!targetSalaryGoal;
  const canAdvanceStep3 = !!weeklyHours && !!motivation;

  const stepTitles = [
    "Workspace & Base City",
    "Role & Industry Domain",
    "Compensation & Goals",
    "Upskilling Commitment",
    "Profile Confirmation"
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#08080c] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-300 font-sans">
      <div className="w-full max-w-[540px] my-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Certifyd Career Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-1.5">
            Set up your custom workspace
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Answer a few quick questions to personalize your AI career radar and salary benchmarks.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="mb-6 bg-white dark:bg-[#121218] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              Step {step + 1} of {totalSteps}: <span className="text-zinc-900 dark:text-white">{stepTitles[step]}</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {progressPercent}% Complete
            </span>
          </div>
          
          <div className="w-full h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            />
          </div>

          <div className="flex justify-between mt-2.5 px-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors ${
                  idx === step ? 'text-emerald-600 dark:text-emerald-400 font-bold' :
                  idx < step ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  idx === step ? 'bg-emerald-500 ring-2 ring-emerald-500/30' :
                  idx < step ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                }`} />
                <span className="hidden sm:inline">Step {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-white dark:bg-[#121218] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              
              {/* STEP 0: WORKSPACE & BASE CITY */}
              {step === 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
                    <Building className="w-4 h-4" /> Workspace Identity
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    Name your personal career hub
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                    This creates your custom URL for portfolio reviews and salary benchmarking reports.
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                        Workspace Name
                      </label>
                      <input
                        autoFocus
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="e.g. Tanuj's Career Radar"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                        Workspace URL
                      </label>
                      <div className="flex items-center rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 overflow-hidden text-sm font-mono">
                        <span className="px-3.5 py-3 text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-white/10 select-none bg-zinc-100 dark:bg-white/[0.03]">
                          certifyd.in/ws/
                        </span>
                        <input
                          type="text"
                          value={workspaceSlug}
                          onChange={(e) => { setSlugManual(true); setWorkspaceSlug(slugify(e.target.value)); }}
                          placeholder="your-slug"
                          className="flex-1 px-3.5 py-3 bg-transparent text-zinc-900 dark:text-white focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                        <MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-500" /> Primary Location / Work Model
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CITIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCity(c)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${
                              city === c 
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' 
                                : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={!canAdvanceStep0}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue to Role & Domain <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: ROLE & DOMAIN */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
                    <Briefcase className="w-4 h-4" /> Role & Industry Domain
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    What describes your career profile?
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                    We calibrate skill gap analyzers and certification ROI scores according to your target role.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                        Current Role Stage
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CAREER_FOCUSES.map((focus) => (
                          <button
                            key={focus}
                            type="button"
                            onClick={() => setCareerFocus(focus)}
                            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left flex items-center justify-between ${
                              careerFocus === focus 
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' 
                                : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span>{focus}</span>
                            {careerFocus === focus && <CheckCircle2 className="w-4 h-4 text-black shrink-0 ml-1" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                        Target Industry Domain
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {TARGET_DOMAINS.map((domain) => (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => setTargetDomain(domain)}
                            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left flex items-center justify-between ${
                              targetDomain === domain 
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' 
                                : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span>{domain}</span>
                            {targetDomain === domain && <CheckCircle2 className="w-4 h-4 text-black shrink-0 ml-1" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="px-5 py-3.5 rounded-xl border border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!canAdvanceStep1}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue to Compensation <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: COMPENSATION & GOALS */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
                    <DollarSign className="w-4 h-4" /> Compensation & Growth Goals
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    Where do you stand & where are you heading?
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                    This lets us calculate exact hike percentages and ROI forecasts for certification investments.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                        Current Annual Salary Band (INR)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SALARY_BANDS.map((band) => (
                          <button
                            key={band}
                            type="button"
                            onClick={() => setCurrentSalaryBand(band)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${
                              currentSalaryBand === band 
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' 
                                : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                            }`}
                          >
                            {band}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                        Primary Career & Salary Goal
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SALARY_GOALS.map((goal) => (
                          <button
                            key={goal.label}
                            type="button"
                            onClick={() => setTargetSalaryGoal(goal.label)}
                            className={`p-3 rounded-xl transition-all border text-left flex flex-col justify-between ${
                              targetSalaryGoal === goal.label 
                                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-sm' 
                                : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-xs font-bold text-zinc-900 dark:text-white">{goal.label}</span>
                              {targetSalaryGoal === goal.label && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                            </div>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">{goal.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3.5 rounded-xl border border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!canAdvanceStep2}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue to Commitment <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: UPSKILLING COMMITMENT */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
                    <Clock className="w-4 h-4" /> Upskilling Commitment
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    How much weekly time can you commit?
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                    We tailor study plans and certification deadlines around your bandwidth.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                        Weekly Study Bandwidth
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {WEEKLY_COMMITMENTS.map((comm) => (
                          <button
                            key={comm.label}
                            type="button"
                            onClick={() => setWeeklyHours(comm.label)}
                            className={`p-3.5 rounded-xl transition-all border text-left flex flex-col justify-between relative ${
                              weeklyHours === comm.label 
                                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 shadow-sm' 
                                : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                              {comm.badge}
                            </span>
                            <div className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 pr-12">
                              {comm.label}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                              {comm.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                        Core Motivation Driving This Upskilling
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {MOTIVATIONS.map((mot) => (
                          <button
                            key={mot}
                            type="button"
                            onClick={() => setMotivation(mot)}
                            className={`px-3.5 py-3 rounded-xl text-xs font-semibold transition-all border text-left flex items-center justify-between ${
                              motivation === mot 
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' 
                                : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span>{mot}</span>
                            {motivation === mot && <CheckCircle2 className="w-4 h-4 text-black shrink-0 ml-1" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-3.5 rounded-xl border border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={!canAdvanceStep3}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Review & Launch <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: AVATAR & FINAL REVIEW */}
              {step === 4 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
                    <Flame className="w-4 h-4 text-amber-500" /> Final Confirmation
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    Your career intelligence hub is ready
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                    Pick an avatar and launch your personalized dashboard.
                  </p>

                  <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-200 dark:border-white/10">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-base shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                          {workspaceName || 'My Workspace'}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                          certifyd.in/ws/{workspaceSlug || 'workspace'}
                        </div>
                      </div>
                    </div>

                    <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
                      Choose Your Avatar Style
                    </label>
                    <AvatarSelector selectedId={selectedAvatarId} onSelect={setSelectedAvatarId} />
                  </div>

                  {/* Summary Checklist */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-6">
                    {[
                      { label: 'Role Stage', val: careerFocus },
                      { label: 'Domain', val: targetDomain },
                      { label: 'Location', val: city },
                      { label: 'Current Salary', val: currentSalaryBand },
                      { label: 'Goal', val: targetSalaryGoal },
                      { label: 'Commitment', val: weeklyHours },
                    ].map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{item.label}</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white mt-1 truncate" title={item.val}>{item.val}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={submitting}
                      className="px-5 py-3.5 rounded-xl border border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-all flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={submitting}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 hover:opacity-95 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Launching Workspace...
                        </>
                      ) : (
                        <>
                          Launch My Career Hub <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] font-mono text-zinc-400 dark:text-zinc-600">
          Secured by Certifyd Enterprise Auth • AES-256 Encryption
        </div>
      </div>
    </div>
  );
}
