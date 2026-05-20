'use client';

import React from 'react';
import { reportIncident } from '@/lib/reportIncident';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    void reportIncident({
      source: 'client',
      severity: 'high',
      message: error.message || 'React render failure',
      stack: error.stack,
      context: { componentStack: info.componentStack },
      admin_action: 'Auto-filed from React error boundary.',
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="min-h-dvh bg-bg px-5 py-10 text-text">
          <div className="mx-auto max-w-md rounded-sm border border-gold/20 bg-surface-2 p-5">
            <p className="font-caption text-[10px] uppercase tracking-[0.16em] text-gold">
              Incident filed
            </p>
            <h1 className="mt-2 font-section text-3xl tracking-normal">We caught it.</h1>
            <p className="mt-3 font-body text-sm leading-relaxed text-text-muted">
              This error was sent to Solvys automatically. Refresh once; if it keeps happening,
              the Linear ticket is already on its way.
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
