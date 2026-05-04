import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('CertifyROI Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
          <div style={{ maxWidth: '480px', textAlign: 'center', background: 'transparent', border: '1px solid transparent', borderRadius: '16px', padding: '40px', boxShadow: 'none' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '8px', lineHeight: '1.65', fontFamily: 'Inter, sans-serif' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '24px', fontFamily: 'JetBrains Mono, monospace' }}>
              Check browser console for details.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              style={{ padding: '11px 28px', borderRadius: '10px', background: 'transparent, #3B8CC7)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: 'none' }}
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary