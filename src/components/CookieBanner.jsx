'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const F_SANS = "var(--font-sans)";

const DEFAULT_PREFERENCES = {
  necessary: true, // Always true
  functional: false,
  analytics: false,
  performance: false
};

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  
  // Accordion state
  const [expandedSection, setExpandedSection] = useState('necessary');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('certifyd_cookie_preferences');
      if (!saved) {
        // Delay showing banner slightly
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      } else {
        setPreferences(JSON.parse(saved));
      }
    } catch (e) {
      setIsVisible(true);
    }
  }, []);

  const saveAndClose = (newPrefs) => {
    localStorage.setItem('certifyd_cookie_preferences', JSON.stringify(newPrefs));
    setPreferences(newPrefs);
    setIsVisible(false);
    setShowModal(false);
    
    // Dispatch an event so ConsentManager and Providers know to wake up
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('certifydConsentUpdated'));
    }
  };

  const handleAcceptAll = () => {
    saveAndClose({ necessary: true, functional: true, analytics: true, performance: true });
  };

  const handleRejectAll = () => {
    saveAndClose({ necessary: true, functional: false, analytics: false, performance: false });
  };

  const handleSavePreferences = () => {
    saveAndClose(preferences);
  };

  const toggleCategory = (category) => {
    if (category === 'necessary') return; // Cannot toggle necessary
    setPreferences(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleAccordion = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <>
      {/* Bottom Sticky Banner */}
      <AnimatePresence>
        {isVisible && !showModal && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#111111',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '24px',
              zIndex: 10000,
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
              fontFamily: F_SANS,
            }}
          >
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                  We value your privacy
                </h3>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'rgba(255,255,255,0.7)' }}>
                  We use cookies to enhance your browsing experience, serve personalised content, and analyse our traffic. By clicking "Accept All", you consent to our use of cookies.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.8)',
                    borderRadius: '4px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: F_SANS
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Customise
                </button>
                <button
                  onClick={handleRejectAll}
                  style={{
                    backgroundColor: '#1d4ed8', // Blue like the screenshot
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: F_SANS
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1e40af'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  style={{
                    backgroundColor: '#1d4ed8', // Blue like the screenshot
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: F_SANS
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1e40af'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                >
                  Accept All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customise Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', fontFamily: F_SANS,
          }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                position: 'relative', width: '100%', maxWidth: '700px',
                background: '#111111', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                maxHeight: '90vh'
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Customise Consent Preferences</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
                  We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.
                  <br/><br/>
                  The cookies that are categorised as "Necessary" are stored on your browser as they are essential for enabling the basic functionalities of the site.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  
                  {/* Category: Necessary */}
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div 
                      onClick={() => toggleAccordion('necessary')}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {expandedSection === 'necessary' ? <ChevronUp size={16} color="#fff" /> : <ChevronDown size={16} color="#fff" />}
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Necessary</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e' }}>Always Active</span>
                    </div>
                    {expandedSection === 'necessary' && (
                      <div style={{ padding: '0 0 20px 28px', fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                        Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.
                      </div>
                    )}
                  </div>

                  {/* Category: Functional */}
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => toggleAccordion('functional')}>
                        {expandedSection === 'functional' ? <ChevronUp size={16} color="#fff" /> : <ChevronDown size={16} color="#fff" />}
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Functional</span>
                      </div>
                      
                      {/* Custom Toggle Switch */}
                      <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          style={{ opacity: 0, width: 0, height: 0 }}
                          checked={preferences.functional}
                          onChange={() => toggleCategory('functional')}
                        />
                        <span style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: preferences.functional ? '#1d4ed8' : 'rgba(255,255,255,0.2)',
                          transition: '.4s', borderRadius: '34px'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                            transform: preferences.functional ? 'translateX(18px)' : 'translateX(0)'
                          }}/>
                        </span>
                      </label>
                    </div>
                    {expandedSection === 'functional' && (
                      <div style={{ padding: '0 0 20px 28px', fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                        Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features.
                      </div>
                    )}
                  </div>

                  {/* Category: Analytics */}
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => toggleAccordion('analytics')}>
                        {expandedSection === 'analytics' ? <ChevronUp size={16} color="#fff" /> : <ChevronDown size={16} color="#fff" />}
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Analytics</span>
                      </div>
                      
                      <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          style={{ opacity: 0, width: 0, height: 0 }}
                          checked={preferences.analytics}
                          onChange={() => toggleCategory('analytics')}
                        />
                        <span style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: preferences.analytics ? '#1d4ed8' : 'rgba(255,255,255,0.2)',
                          transition: '.4s', borderRadius: '34px'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                            transform: preferences.analytics ? 'translateX(18px)' : 'translateX(0)'
                          }}/>
                        </span>
                      </label>
                    </div>
                    {expandedSection === 'analytics' && (
                      <div style={{ padding: '0 0 20px 28px', fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                        Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc.
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Footer / Actions */}
              <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleRejectAll}
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save My Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Accept All
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CookieBanner;
