"use client";

import { useState } from "react";

const domains = ["Cloud", "Data & AI", "Cybersecurity", "Project Mgmt", "General IT"];

// Multipliers adjusted to realistic ranges (capped around 25%)
const domainData: Record<string, { multiplier: number; cost: number }> = {
  "Cloud": { multiplier: 1.18, cost: 45000 },
  "Data & AI": { multiplier: 1.22, cost: 55000 },
  "Cybersecurity": { multiplier: 1.15, cost: 60000 },
  "Project Mgmt": { multiplier: 1.12, cost: 35000 },
  "General IT": { multiplier: 1.08, cost: 15000 },
};

export default function Calculator() {
  const [salary, setSalary] = useState(600000); // 6L default
  const [domain, setDomain] = useState("Cloud");

  // Calculate metrics
  const data = domainData[domain];
  const deltaSalary = salary * (data.multiplier - 1);
  const upliftPercent = (data.multiplier - 1) * 100;
  
  // Payback period in months = (Cost / Annual Delta) * 12
  const rawPaybackMonths = (data.cost / deltaSalary) * 12;
  const paybackMonths = Math.round(rawPaybackMonths);

  // Clamping check
  const outOfBounds = paybackMonths < 1 || paybackMonths > 120 || upliftPercent > 25;

  // Format currency
  const formatINR = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${(val / 1000).toFixed(0)}k`;
  };

  return (
    <section id="calculator" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Calculate your potential</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            See the average ROI for certifications in your domain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Left Card - Inputs */}
          <div className="bg-card border border-border p-8 rounded-xl flex flex-col gap-10">
            
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="block text-sm font-semibold text-text-primary uppercase tracking-wide">
                  Current Annual Salary
                </label>
                <div className="font-mono text-2xl font-bold text-brand">
                  {formatINR(salary)}
                </div>
              </div>
              
              <div className="relative pt-2">
                <input
                  type="range"
                  min={300000}
                  max={3000000}
                  step={50000}
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full h-2 bg-elevated rounded-lg appearance-none cursor-pointer accent-brand"
                  style={{
                    background: `linear-gradient(to right, var(--brand) ${((salary - 300000) / (3000000 - 300000)) * 100}%, var(--elevated) 0)`
                  }}
                />
                <div className="flex justify-between text-xs text-text-secondary mt-2 font-mono">
                  <span>₹3L</span>
                  <span>₹30L+</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-text-primary uppercase tracking-wide">
                Certification Category
              </label>
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      domain === d
                        ? "bg-brand border-brand text-white"
                        : "bg-background border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Card - Outputs */}
          <div className="bg-card border border-border p-8 rounded-xl flex flex-col justify-center text-center relative overflow-hidden">
            
            {outOfBounds ? (
              <div className="flex flex-col items-center justify-center space-y-4 h-full">
                <p className="text-text-secondary font-medium">Not enough data for this range yet.</p>
                <p className="text-sm text-text-secondary/70">
                  We don't have enough verified outcomes at this salary band to provide a confident projection.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-10">
                  <p className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Payback Period</p>
                  <div className="font-mono text-5xl md:text-7xl font-bold text-brand tabular-nums tracking-tighter">
                    {paybackMonths} <span className="text-3xl md:text-4xl">months</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-8">
                  <div className="space-y-1">
                    <p className="text-sm text-text-secondary">Estimated Cost</p>
                    <p className="font-mono text-2xl font-semibold text-text-primary">{formatINR(data.cost)}</p>
                  </div>
                  <div className="space-y-1 border-l border-border pl-4">
                    <p className="text-sm text-text-secondary">Typical Salary Uplift</p>
                    <p className="font-mono text-2xl font-semibold text-[#5B8C72]">+{formatINR(deltaSalary)}/yr</p>
                  </div>
                </div>

                <p className="text-xs text-text-secondary/70 italic mt-8">
                  *Estimates based on aggregated market data. Not a guarantee of salary outcomes.
                </p>
              </>
            )}
            
          </div>

        </div>
      </div>
    </section>
  );
}
