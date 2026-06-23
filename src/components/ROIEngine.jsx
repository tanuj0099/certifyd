import React, { useState, useMemo, useEffect } from 'react';
import { X, FileText } from 'lucide-react';

const USD_TO_INR = 95.70;
// Constants for implicit logic not strictly defined by the user
const WEEKS_OF_STUDY = 12; 
const HOURLY_RATE_INR = 1000; 
const DEFAULT_CURRENT_SALARY = 1500000; // 15 LPA

const ROIEngine = ({ currentSalary = DEFAULT_CURRENT_SALARY }) => {
  // State for user-adjustable inputs
  const [costUSD, setCostUSD] = useState(300);
  const [studyHoursPerWeek, setStudyHoursPerWeek] = useState(10);
  const [salaryBumpPercent, setSalaryBumpPercent] = useState(20);

  // DPDP Consent State
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    const hasSeenConsent = localStorage.getItem('roi_consent_seen');
    if (!hasSeenConsent) {
      setShowConsentBanner(true);
    }
  }, []);

  const dismissConsent = () => {
    if (!consentChecked) return;
    localStorage.setItem('roi_consent_seen', 'true');
    setShowConsentBanner(false);
  };

  // Formatting utility
  const formatINR = (value) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  // Core Calculation Engine
  const { totalCost, netGain, roi, paybackMonths } = useMemo(() => {
    // 1. Study Cost Estimation (Time is money)
    const studyCostINR = studyHoursPerWeek * WEEKS_OF_STUDY * HOURLY_RATE_INR;
    
    // 2. Total Cost
    const totalCostINR = (costUSD * USD_TO_INR) + studyCostINR;
    
    // 3. Net Gain
    const netGainINR = (currentSalary * salaryBumpPercent) / 100;
    
    // 4. ROI %
    const roiPercentage = totalCostINR > 0 ? ((netGainINR - totalCostINR) / totalCostINR) * 100 : 0;
    
    // 5. Payback Period (Months)
    // How many months of the "bump" does it take to pay off the total cost?
    const monthlyBump = netGainINR / 12;
    const payback = monthlyBump > 0 ? (totalCostINR / monthlyBump).toFixed(1) : '';

    return {
      totalCost: totalCostINR,
      netGain: netGainINR,
      roi: roiPercentage,
      paybackMonths: payback
    };
  }, [costUSD, studyHoursPerWeek, salaryBumpPercent, currentSalary]);

  return (
    <div className="bg-black w-full text-white p-6 md:p-12 rounded-3xl relative">
      {/* DPDP First-Use Consent Modal */}
      {showConsentBanner && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-sm rounded-3xl overflow-hidden">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white text-center">Before you calculate...</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 w-5 h-5 accent-orange-500 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-zinc-300">
                I agree to the processing of my data in accordance with the <a href="/terms" className="text-orange-500 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-orange-500 hover:underline">Privacy Policy</a>.
              </span>
            </label>
            <button 
              onClick={dismissConsent}
              disabled={!consentChecked}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                consentChecked 
                  ? 'bg-orange-500 text-black hover:bg-orange-400' 
                  : 'bg-white/5 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Continue to Calculator
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Left Column: Interactive Sliders */}
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Investment Variables</h2>
            <p className="text-zinc-400 text-sm mb-8">
              Adjust the parameters below to instantly calculate the projected return on your certification investment.
            </p>
          </div>

          {/* Slider 1: Cost */}
          <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-300">Certification Cost (USD)</label>
              <span className="text-lg font-bold text-white">${costUSD}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2000" 
              step="50"
              value={costUSD} 
              onChange={(e) => setCostUSD(Number(e.target.value))}
              className="w-full accent-white h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider 2: Study Hours */}
          <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-300">Study Hours per Week</label>
              <span className="text-lg font-bold text-white">{studyHoursPerWeek} hrs</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="40" 
              step="1"
              value={studyHoursPerWeek} 
              onChange={(e) => setStudyHoursPerWeek(Number(e.target.value))}
              className="w-full accent-white h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider 3: Salary Bump */}
          <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-300">Expected Salary Bump</label>
              <span className="text-lg font-bold text-orange-400">+{salaryBumpPercent}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="1"
              value={salaryBumpPercent} 
              onChange={(e) => setSalaryBumpPercent(Number(e.target.value))}
              className="w-full accent-orange-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: ROI Readout */}
        <div className="flex flex-col justify-center gap-8 bg-white/[0.02] border border-white/5 p-8 lg:p-12 rounded-3xl relative overflow-hidden">
          
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/10 blur-[100px] pointer-events-none rounded-full"></div>
          
          <div className="relative z-10 flex flex-col gap-10">
            {/* Massive ROI Readout */}
            <div>
              <p className="text-lg font-medium text-zinc-400 mb-2 uppercase tracking-widest text-sm">Projected ROI</p>
              <div 
                className="text-5xl lg:text-7xl font-extrabold text-orange-400 tracking-tighter"
                style={{ filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.5))' }}
              >
                {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Payback Period */}
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-widest text-sm font-medium text-slate-600">Payback Period</p>
                <div className="text-4xl font-bold text-white tracking-tight">
                  {paybackMonths} <span className="text-xl text-zinc-500 font-medium">mo</span>
                </div>
              </div>

              {/* Net Gain */}
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-widest text-sm font-medium text-slate-600">Annual Net Gain</p>
                <div className="text-4xl font-bold text-white tracking-tight">
                  {formatINR(netGain)}
                </div>
              </div>
            </div>

            {/* Total True Cost Breakdown */}
            <div className="pt-8 border-t border-white/10">
              <p className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-widest text-sm font-medium text-slate-600">Total True Cost (Exam + Time)</p>
              <div className="text-3xl font-bold text-zinc-300 tracking-tight">
                {formatINR(totalCost)}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ROIEngine;
