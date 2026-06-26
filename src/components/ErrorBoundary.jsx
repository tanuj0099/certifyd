'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center space-y-3 w-full">
          <AlertTriangle className="w-8 h-8 text-red-500 opacity-80" />
          <div>
            <h3 className="text-red-500 font-semibold mb-1">Component Failed to Load</h3>
            <p className="text-sm text-red-400/80 mb-4 max-w-sm">
              We encountered an unexpected error rendering this section. The rest of the page should still work.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
