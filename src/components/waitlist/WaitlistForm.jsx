'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Check } from 'lucide-react';

export default function WaitlistForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Please provide both your name and email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client failed to initialize. Please check network connection.');
      }

      // 1. Query current row count from certifyd_waitlist
      const { count, error: countError } = await supabase
        .from('certifyd_waitlist')
        .select('*', { count: 'exact', head: true });

      const currentCount = count !== null && count !== undefined ? count : 0;
      const computedPosition = 400 + currentCount + Math.floor(Math.random() * 8) + 1;

      // 2. Insert user into certifyd_waitlist table
      const { data, error: insertError } = await supabase
        .from('certifyd_waitlist')
        .insert([
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            position: computedPosition
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505' || (insertError.message && insertError.message.toLowerCase().includes('unique'))) {
          throw new Error("You're already on the list!");
        } else {
          throw new Error(insertError.message || 'Error inserting into waitlist. Please try again.');
        }
      }

      setPosition(computedPosition);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist-section" className="py-20 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Request Early Access</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">Join the waitlist for priority access to the platform.</p>
      </div>

      {!success ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 rounded-lg shadow-sm text-left">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="user-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-brand-primary">*</span>
              </label>
              <input 
                type="text" 
                id="user-name" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary text-sm transition-colors"
              />
            </div>

            <div>
              <label htmlFor="user-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-brand-primary">*</span>
              </label>
              <input 
                type="email" 
                id="user-email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full px-4 py-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary text-sm transition-colors"
              />
            </div>

            <div>
              <label htmlFor="user-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
              </label>
              <input 
                type="tel" 
                id="user-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 00000 00000"
                className="w-full px-4 py-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary text-sm transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-semantic-negative/10 border border-semantic-negative/30 text-semantic-negative text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-6 rounded-md bg-brand-primary hover:bg-orange-600 disabled:opacity-70 disabled:hover:bg-brand-primary text-white font-medium text-sm transition-colors flex items-center justify-center relative"
            >
              <span className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                Submit Request
              </span>
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center bg-brand-primary rounded-md">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-lg shadow-sm text-center space-y-5">
          <div className="w-12 h-12 bg-semantic-positive/10 border border-semantic-positive/20 text-semantic-positive rounded-full flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              You're on the waitlist!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Thank you for requesting early access to Certifyd.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-md flex flex-col items-center justify-center">
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
              Your Reserved Waitlist Spot
            </span>
            <span className="font-mono text-3xl font-bold text-brand-primary mt-1 tabular-nums tracking-tight">
              #{position}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
