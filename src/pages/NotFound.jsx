import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import ToolPageWrapper from '../components/ToolPageWrapper.jsx';

export default function NotFound() {
  return (
    <ToolPageWrapper
      eyebrow="SYSTEM_ERROR"
      title="404"
      subtitle="Page Not Found"
      description="The certification path or data tool you are looking for has been moved, deleted, or does not exist."
      footer={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '64px 24px', textAlign: 'center',
          background: 'var(--bg)', borderRadius: '12px',
          border: '1px solid var(--border)'
        }}
      >
        <AlertTriangle size={48} color="var(--text-3)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '24px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>
          Path Not Found
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-2)', maxWidth: '400px', marginBottom: '32px' }}>
          Looks like you've wandered off the optimal career trajectory. Let's get you back on track.
        </p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          Return to Dashboard
        </Link>
      </motion.div>
    </ToolPageWrapper>
  );
}
