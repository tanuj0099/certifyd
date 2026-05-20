import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import ToolPageWrapper from '../components/ToolPageWrapper.jsx';

export default function Unauthorized() {
  return (
    <ToolPageWrapper
      eyebrow="ACCESS_DENIED"
      title="403"
      subtitle="Unauthorized"
      description="You do not have permission to access this page. Please contact your administrator if you believe this is an error."
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
        <Lock size={48} color="var(--text-3)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '24px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>
          Access Restricted
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-2)', maxWidth: '400px', marginBottom: '32px' }}>
          Your account does not have the required credentials to view this section.
        </p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          Return to Dashboard
        </Link>
      </motion.div>
    </ToolPageWrapper>
  );
}
