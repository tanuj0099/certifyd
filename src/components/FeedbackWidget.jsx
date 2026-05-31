import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function FeedbackWidget({ source }) {
  const [submitted, setSubmitted] = useState(false)
  const { user } = useAuth()

  const handleFeedback = async (isHelpful) => {
    setSubmitted(true)
    if (supabase) {
      try {
        await supabase.from('feedback_events').insert({
          user_id: user?.uid || null,
          source: source,
          is_helpful: isHelpful,
          created_at: new Date().toISOString()
        })
      } catch (err) {
        console.warn('Feedback not saved', err)
      }
    }
  }

  return (
    <div style={{
      marginTop: '40px',
      paddingTop: '24px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-3)', fontWeight: 500 }}>
              Was this tool useful?
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleFeedback(true)}
                title="Yes"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                  color: 'var(--text-3)', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text-4)' }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => handleFeedback(false)}
                title="No"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                  color: 'var(--text-3)', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text-4)' }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: '6px 16px', borderRadius: '999px',
              background: 'rgba(45, 184, 122, 0.1)', color: '#2db87a',
              fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <ThumbsUp size={12} /> Thanks for your feedback!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
