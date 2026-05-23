import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import CertificationCard from './CertificationCard.jsx';
import SkeletonGrid from './SkeletonGrid.jsx';
import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Robust Supabase fetch joining the domains table
        const { data, error: fetchError } = await supabase
          .from('certifications')
          .select('*, domains(domain_name, family_group)');

        if (fetchError) {
          throw fetchError;
        }

        setCertifications(data || []);
      } catch (err) {
        console.error('Error fetching certifications:', err);
        setError(err.message || 'Failed to load certifications.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertifications();
  }, []);

  return (
    <div className="w-full min-h-screen bg-black text-white p-4 md:p-8 lg:p-12 overflow-visible">
      <div className="max-w-[1400px] mx-auto overflow-visible">
        
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Certification Finder
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm md:text-base">
            Explore industry-recognized certifications across multiple domains. Track salary expectations and difficulty levels to maximize your career ROI.
          </p>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-300">Connection Error</h3>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Latch logic using a ternary operator as requested */}
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {certifications.length > 0 ? (
              certifications.map((cert) => (
                <CertificationCard key={cert.id} cert={cert} />
              ))
            ) : (
              !error && (
                <div className="col-span-full py-20 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                  <p>No certifications found.</p>
                </div>
              )
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
