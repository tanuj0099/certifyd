import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageSquare, X, CheckCircle2, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function FeedbackWidget({ source }) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0) // 0: trigger, 1: form, 2: success
  const { user } = useAuth()

  // Form State
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [helpedDecide, setHelpedDecide] = useState(null)
  const [dataAccuracy, setDataAccuracy] = useState('')
  const [improvementArea, setImprovementArea] = useState('')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    if (supabase) {
      try {
        await supabase.from('feedback_reviews').insert({
          user_id: user?.uid || null,
          source_page: source,
          star_rating: rating,
          helped_decide: helpedDecide,
          data_accuracy: dataAccuracy,
          improvement_area: improvementArea,
          comments: comments || null,
          created_at: new Date().toISOString()
        })
      } catch (err) {
        console.warn('Feedback not saved. Ensure the feedback_reviews table exists in Supabase.', err)
      }
    }
    setIsSubmitting(false)
    setStep(2) // Show success
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      setIsOpen(false)
      // Reset form
      setTimeout(() => {
        setStep(0)
        setRating(0)
        setHelpedDecide(null)
        setDataAccuracy('')
        setImprovementArea('')
        setComments('')
      }, 500)
    }, 3000)
  }

  return (
    <>
      <div style={{
        marginTop: '60px',
        paddingTop: '32px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => { setIsOpen(true); setStep(1); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '100px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-3)', fontSize: '13px', fontFamily: 'var(--font-sans)',
            fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text-4)' }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <MessageSquare size={16} />
          Leave Feedback
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
          }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
              }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'relative',
                width: '100%', maxWidth: '440px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '32px 24px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                overflow: 'hidden'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'none', border: 'none', color: 'var(--text-4)',
                  cursor: 'pointer', padding: '4px', display: 'flex'
                }}
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                  >
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                        Help us improve Certifyd
                      </h3>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-3)' }}>
                        Your feedback helps us provide more accurate and useful data.
                      </p>
                    </div>

                    {/* Star Rating */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Overall Experience
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                              color: (hoverRating || rating) >= star ? '#FBBF24' : 'var(--border)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Star size={32} fill={(hoverRating || rating) >= star ? '#FBBF24' : 'transparent'} strokeWidth={1.5} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Questions */}
                    {rating > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                      >
                        {/* Helped Decide? */}
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                            Did this tool help you make a career decision?
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {['Yes', 'No'].map((opt) => {
                              const isSel = (helpedDecide === (opt === 'Yes'))
                              return (
                                <button
                                  key={opt}
                                  onClick={() => setHelpedDecide(opt === 'Yes')}
                                  style={{
                                    flex: 1, padding: '10px', borderRadius: '8px',
                                    fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                                    background: isSel ? 'var(--accent)' : 'var(--surface)',
                                    color: isSel ? '#fff' : 'var(--text-2)',
                                    border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                                    cursor: 'pointer', transition: 'all 0.2s'
                                  }}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Data Accuracy */}
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                            Do the salary and ROI estimates look accurate?
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {['Yes', 'No', 'Not Sure'].map((opt) => {
                              const isSel = dataAccuracy === opt
                              return (
                                <button
                                  key={opt}
                                  onClick={() => setDataAccuracy(opt)}
                                  style={{
                                    padding: '8px 16px', borderRadius: '100px',
                                    fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500,
                                    background: isSel ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: isSel ? 'var(--text)' : 'var(--text-3)',
                                    border: `1px solid ${isSel ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
                                    cursor: 'pointer', transition: 'all 0.2s'
                                  }}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Comments (Optional) */}
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                            Any other feedback? <span style={{ color: 'var(--text-4)' }}>(Optional)</span>
                          </label>
                          <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Tell us what you liked or what we can improve..."
                            style={{
                              width: '100%', height: '80px', padding: '12px',
                              borderRadius: '12px', background: 'var(--surface)',
                              border: '1px solid var(--border)', color: 'var(--text)',
                              fontFamily: 'var(--font-sans)', fontSize: '13px', resize: 'none'
                            }}
                          />
                        </div>

                        {/* Submit */}
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          style={{
                            marginTop: '8px', padding: '14px', width: '100%',
                            borderRadius: '12px', background: 'var(--text)', color: 'var(--bg)',
                            fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            border: 'none', cursor: isSubmitting ? 'wait' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1
                          }}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                          {!isSubmitting && <ChevronRight size={16} />}
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', padding: '32px 0', textAlign: 'center', gap: '16px'
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}
                    >
                      <CheckCircle2 size={64} color="var(--brand-primary)" />
                    </motion.div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                        Thank You!
                      </h3>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-3)' }}>
                        Your feedback has been received.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
