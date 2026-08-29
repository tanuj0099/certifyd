'use client';

import { useState, useEffect } from 'react';

const certData = {
  'cloud': { label: 'Cloud', salaryBump: 0.25, cost: 15000, heat: 1.1, oppCost: 5000 },
  'data': { label: 'Data & AI', salaryBump: 0.30, cost: 22000, heat: 1.2, oppCost: 7000 },
  'cyber': { label: 'Cybersecurity', salaryBump: 0.22, cost: 25000, heat: 1.15, oppCost: 6000 },
  'pm': { label: 'Project Mgmt', salaryBump: 0.15, cost: 35000, heat: 0.95, oppCost: 8000 },
  'it': { label: 'General IT', salaryBump: 0.10, cost: 10000, heat: 1.0, oppCost: 4000 }
};

export default function QuickCalculator() {
  const [domain, setDomain] = useState('cloud');
  const [salary, setSalary] = useState(1200000);
  const [cityMultiplier, setCityMultiplier] = useState(1.0);

  const [roiPercentage, setRoiPercentage] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [newSalary, setNewSalary] = useState(0);

  useEffect(() => {
    const data = certData[domain];
    const s = Number(salary) || 0;
    const cm = Number(cityMultiplier) || 1.0;

    const deltaSalary = s * data.salaryBump;
    const cost = data.cost;
    const oppCost = data.oppCost;
    const heat = data.heat * cm;

    const rawROI = ((deltaSalary * heat) - cost) / oppCost;
    const percentage = Math.max(0, Math.round(rawROI * 100));
    const projectedSalary = s + (deltaSalary * heat);

    setRoiPercentage(percentage);
    setTotalCost(cost);
    setNewSalary(projectedSalary);
  }, [domain, salary, cityMultiplier]);

  return (
    <section id="calculator" className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 sm:p-8">
        
        <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
          <h2 className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Interactive Preview</h2>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mt-1">ROI Estimator</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Inputs */}
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Certification Domain</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(certData).map(([key, data]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDomain(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      domain === key 
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {data.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="calc-salary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Annual Salary (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">₹</span>
                <input 
                  type="number" 
                  id="calc-salary" 
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-mono tabular-nums text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="calc-city" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City Calibration</label>
              <select 
                id="calc-city"
                value={cityMultiplier}
                onChange={(e) => setCityMultiplier(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-primary appearance-none"
              >
                <option value="1.0">All India (Default)</option>
                <option value="1.2">Bengaluru</option>
                <option value="1.15">Hyderabad</option>
                <option value="1.1">Pune</option>
                <option value="1.05">Delhi NCR</option>
              </select>
            </div>

          </div>

          {/* Outputs */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-6 border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
            
            <div className="text-center mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Projected 1-Year ROI</p>
              <p className="font-mono tabular-nums text-4xl sm:text-5xl font-bold text-brand-primary">
                {roiPercentage}%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Est. Total Cost</p>
                <p className="font-mono tabular-nums text-sm font-semibold text-semantic-negative">
                  ₹{totalCost.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Projected New Salary</p>
                <p className="font-mono tabular-nums text-sm font-semibold text-semantic-positive">
                  ₹{Math.round(newSalary).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
