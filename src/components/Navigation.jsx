import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, LogIn, LogOut, User } from 'lucide-react'
// Comment out useAuth for now - add later
import { useAuth } from '../hooks/useAuth.jsx'


const Navigation = () => {
  const [signingIn, setSigningIn] = useState(false)
  const { user, signInGoogle, signOut, loading } = useAuth()

  const handleSignIn = async () => {
    setSigningIn(true)
    try { await signInGoogle() } catch { }
    setSigningIn(false)
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'transparent',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'var(--accent)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={18} color="var(--bg)" />
            </div>
            <span style={{ fontFamily: 'Bebas Neue', fontSize: '22px', letterSpacing: '0.06em', color: '#F8FAFC' }}>
              Certify<span style={{ color: 'var(--linear-blue)' }}>ROI</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!loading && (
              user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid transparent' }} />
                  ) : (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={14} color="var(--bg)" />
                    </div>
                  )}
                  <button
                    onClick={signOut}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px',
                      background: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: '8px', color: '#FCA5A5', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    <LogOut size={13} />Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={signingIn}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 18px',
                    background: 'var(--accent)',
                    border: 'none', borderRadius: '10px', color: 'var(--bg)',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    opacity: signingIn ? 0.7 : 1,
                  }}
                >
                  <LogIn size={14} />
                  {signingIn ? 'Signing in...' : 'Sign in'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navigation
