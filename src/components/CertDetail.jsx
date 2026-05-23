import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { ArrowLeft, IndianRupee, Briefcase, Clock, Trophy } from 'lucide-react';

const CertDetail = () => {
  const { slug } = useParams();
  const [cert, setCert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('certifications')
          .select('*, domains(domain_name)')
          .eq('slug', slug)
          .single();

        if (fetchError) throw fetchError;
        setCert(data);
      } catch (err) {
        console.error('Error fetching cert details:', err);
        setError(err.message || 'Failed to load certification details.');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchCert();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black w-full text-white p-6 md:p-12">
        <div className="max-w-[1000px] mx-auto animate-pulse">
          <div className="h-4 w-32 bg-white/5 rounded mb-12"></div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-24 bg-white/5 rounded-full"></div>
            <div className="h-6 w-24 bg-white/5 rounded-full"></div>
          </div>
          <div className="h-10 md:h-12 w-3/4 bg-white/10 rounded mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="h-28 bg-zinc-900/20 border border-white/5 rounded-2xl"></div>
            <div className="h-28 bg-zinc-900/20 border border-white/5 rounded-2xl"></div>
            <div className="h-28 bg-zinc-900/20 border border-white/5 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-black w-full text-white p-6 md:p-12 flex flex-col items-center justify-center">
        <p className="text-zinc-500 mb-6">{error || 'Certification not found.'}</p>
        <Link to="/app" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Radar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black w-full text-white pb-20">
      <div className="max-w-[1000px] mx-auto p-6 lg:p-12">
        
        {/* Top Nav */}
        <nav className="mb-12">
          <Link 
            to="/app" 
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> 
            Back to Radar
          </Link>
        </nav>

        {/* Header Section */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-3 mb-6">
            {cert.provider && (
              <span className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-zinc-300 rounded-full flex items-center gap-1.5">
                {cert.provider}
              </span>
            )}
            {cert.difficulty && (
              <span className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-zinc-300 rounded-full flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                {cert.difficulty}
              </span>
            )}
            {cert.domains?.domain_name && (
              <span className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-zinc-300 rounded-full flex items-center gap-1.5">
                {cert.domains.domain_name}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl text-white font-bold tracking-tight leading-tight">
            {cert.name}
          </h1>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          
          {/* Metric 1: Target Salary */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <IndianRupee className="w-4 h-4" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Target Salary</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {cert.salary_floor ? `₹${cert.salary_floor.toLocaleString('en-IN')}+` : '—'}
            </p>
          </div>

          {/* Metric 2: Market Demand */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <Briefcase className="w-4 h-4" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Market Demand</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {cert.job_count ? `${cert.job_count.toLocaleString('en-IN')} active jobs` : '—'}
            </p>
          </div>

          {/* Metric 3: Time Commitment / Difficulty */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Prep Time</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {cert.time_commitment_months ? `${cert.time_commitment_months} Months` : cert.difficulty || '—'}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CertDetail;
