import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, LayoutDashboard, Calculator, FileText } from 'lucide-react';
import { useJourneyStore } from '@/store/useJourneyStore.js';
import { FeedbackAction } from './watermelon-ui/feedback-action-base.jsx';
import { supabase } from '../lib/supabase.js';
import { useRouter } from 'next/navigation';
import { callGroqForResume } from '@/services/aiService.jsx';

export default function WelcomeOnboarding({ onComplete }) {
  const [status, setStatus] = useState('idle'); // idle, uploading, extracting, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const setResumeName = useJourneyStore(s => s.setResumeName);
  const router = useRouter();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    
    // Simulate upload delay for premium feel
    await new Promise(r => setTimeout(r, 1200));
    
    setStatus('extracting');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const parseRes = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });
      if (!parseRes.ok) {
        const errData = await parseRes.json().catch(() => ({}));
        throw new Error(errData.error || 'File parse failed');
      }
      
      const parseData = await parseRes.json();
      if (!parseData.text) throw new Error('No text extracted');

      setStatus('extracting');

      const prompt = `You are a career data extractor. Read this resume text and output ONLY a JSON object.
      
{
  "inferredRole": "Their current or most recent job title",
  "recommendedDomain": "One of: Cloud / Tech, Data & AI, Cybersecurity, Finance, Management, Marketing, HR & People. (Pick closest match)",
  "estimatedSalary": "A realistic number in Lakhs (e.g., 6.5) based on their YOE and role. If unknown, guess based on Indian market.",
  "topSkills": ["skill1", "skill2", "skill3", "skill4"]
}

Resume Text:
"""
${parseData.text.substring(0, 4000)}
"""`;

      const aiText = await callGroqForResume(null, prompt);
      const cleaned = aiText.replace(/^```(?:json)?\\s*/i, '').replace(/\\s*```\\s*$/, '').trim();
      const data = JSON.parse(cleaned);

      // Set to store
      setResumeName(file.name);
      useJourneyStore.setState({
        currentRole: data.inferredRole || '',
        targetDomain: data.recommendedDomain || '',
        currentSalary: data.estimatedSalary || '',
        skills: data.topSkills || []
      });

      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Could not process resume. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'error' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px' }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <UploadCloud size={28} color="var(--text)" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>
              Welcome to your Workspace
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-2)', maxWidth: '400px', margin: '0 auto 32px' }}>
              Upload your resume or LinkedIn PDF to instantly unlock personalized ROI calculations and offer analysis.
            </p>
            
            {status === 'error' && (
              <div style={{ color: 'var(--err)', fontSize: '13px', marginBottom: '16px' }}>{errorMsg}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: 'var(--text)', color: 'var(--bg)', borderRadius: '999px', fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <UploadCloud size={18} />
                Upload Resume
                <input type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
              </label>

              <button 
                onClick={() => { if(onComplete) onComplete(); else router.push('/dashboard'); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        ) : status === 'uploading' || status === 'extracting' ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <FeedbackAction status="loading" loadingMessage={status === 'uploading' ? 'Uploading securely...' : 'Extracting career vector...'} />
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px' }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>
              Success!
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-2)', maxWidth: '400px', margin: '0 auto 40px' }}>
              Your profile context is set. Where would you like to go next?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
              <button onClick={() => { if(onComplete) onComplete(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <LayoutDashboard size={24} color="var(--text)" />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Go to Dashboard</span>
              </button>
              <button onClick={() => router.push('/tools/roi')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Calculator size={24} color="var(--text)" />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Calculate ROI</span>
              </button>
              <button onClick={() => router.push('/offer-analysis')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <FileText size={24} color="var(--text)" />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Offer Analysis</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
