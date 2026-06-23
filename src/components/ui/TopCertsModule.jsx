import React, { useState } from 'react';
import { Trophy, ChevronDown, DollarSign, Clock, Target, BookOpen } from 'lucide-react';
import { TOP_CERTS_DATABASE } from '../../data/topCerts';

export default function TopCertsModule({ roadmapId }) {
  const [expandedId, setExpandedId] = useState(null);
  const certs = TOP_CERTS_DATABASE[roadmapId];

  // If we haven't hardcoded certs for this specific roadmap yet, hide the module entirely.
  if (!certs || certs.length === 0) return null;

  const getRankStyle = (rank) => {
    if (rank === 1) return "bg-amber-100 text-amber-700 border-amber-300"; // Gold
    if (rank === 2) return "bg-slate-200 text-slate-700 border-slate-300"; // Silver
    if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-300"; // Bronze
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-3xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-3 mb-3">
          <Trophy className="text-amber-500" size={32} />
          Top 3 Recommended Certifications
        </h2>
        <p className="text-lg text-slate-600">The highest ROI certificates for this specific path, ranked by industry demand.</p>
      </div>

      <div className="flex flex-col gap-4">
        {certs.map((cert) => {
          const isExpanded = expandedId === cert.id;

          return (
            <div 
              key={cert.id} 
              className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm ${
                isExpanded ? 'border-indigo-300 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Header (Always visible) */}
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : cert.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-full border-2 flex items-center justify-center font-black text-xl shadow-inner ${getRankStyle(cert.rank)}`}>
                    #{cert.rank}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900">{cert.name}</h3>
                    <p className="text-sm font-medium text-slate-600 font-bold text-slate-500 uppercase tracking-widest">{cert.issuer}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6 self-end md:self-auto">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <DollarSign size={16} className="text-orange-500"/> {cert.cost}
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    
                    {/* The "Why & How" (Takes up 2 columns) */}
                    <div className="md:col-span-2 space-y-6">
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-600 font-black text-indigo-900 uppercase tracking-widest mb-2">
                          <Target size={16} className="text-indigo-500"/> Why it matters
                        </h4>
                        <p className="text-slate-700 text-sm leading-relaxed">{cert.whyItMatters}</p>
                      </div>
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-600 font-black text-indigo-900 uppercase tracking-widest mb-2">
                          <BookOpen size={16} className="text-indigo-500"/> How to prepare
                        </h4>
                        <p className="text-slate-700 text-sm leading-relaxed">{cert.howToPrepare}</p>
                      </div>
                    </div>

                    {/* Logistics Card (Takes up 1 column) */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
                      <div>
                        <span className="block text-sm font-medium text-slate-600 font-bold text-slate-400 uppercase tracking-widest mb-1">Difficulty</span>
                        <span className="text-slate-900 font-bold text-sm">{cert.difficulty}</span>
                      </div>
                      <div className="w-full h-px bg-slate-100"></div>
                      <div>
                        <span className="block text-sm font-medium text-slate-600 font-bold text-slate-400 uppercase tracking-widest mb-1">Time to Prep</span>
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                          <Clock size={14} className="text-amber-500"/> {cert.timeToPrep}
                        </div>
                      </div>
                      <div className="w-full h-px bg-slate-100"></div>
                      <div>
                        <span className="block text-sm font-medium text-slate-600 font-bold text-slate-400 uppercase tracking-widest mb-1">Eligibility Criteria</span>
                        <p className="text-slate-700 text-sm font-medium text-slate-600 leading-relaxed">{cert.eligibility}</p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}