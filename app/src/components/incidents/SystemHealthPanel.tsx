'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import type { AppUpdateRecord, StoredIncident } from '@/lib/incidents';

interface HealthResponse {
  incidents: StoredIncident[];
  updates: AppUpdateRecord[];
  error?: string;
}

export function SystemHealthPanel() {
  const [health, setHealth] = useState<HealthResponse>({ incidents: [], updates: [] });
  const [loading, setLoading] = useState(true);

  async function loadHealth() {
    setLoading(true);
    try {
      const res = await fetch('/api/incidents', { cache: 'no-store' });
      setHealth((await res.json()) as HealthResponse);
    } catch (error) {
      setHealth({
        incidents: [],
        updates: [],
        error: error instanceof Error ? error.message : 'System health unavailable',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  const hasOpen = health.incidents.length > 0;
  const title = health.error ? 'Setup needed' : hasOpen ? 'Needs eyes' : 'All clear';

  return (
    <section className="rounded-sm border border-gold/20 bg-surface-2 p-4 shadow-glass">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-caption text-[10px] uppercase tracking-[0.16em] text-gold">
            System health
          </p>
          <h2 className="mt-2 font-section text-3xl leading-none tracking-normal text-text">{title}</h2>
        </div>
        <button
          type="button"
          onClick={loadHealth}
          className="rounded-sm border border-border p-2 text-text-muted transition-colors hover:border-gold hover:text-gold"
          aria-label="Refresh system health"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.7} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {health.error ? (
          <div className="rounded-sm border border-border bg-bg/70 p-3">
            <p className="font-body text-sm text-text-muted">{health.error}</p>
          </div>
        ) : null}

        {!hasOpen && !health.error ? (
          <div className="flex items-start gap-3 rounded-sm border border-border bg-bg/70 p-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-gold" strokeWidth={1.7} />
            <p className="font-body text-sm text-text-muted">
              No open incidents. New failures auto-file Linear issues and show up here.
            </p>
          </div>
        ) : null}

        {health.incidents.map((incident) => (
          <article key={incident.id} className="rounded-sm border border-border bg-bg/70 p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-gold" strokeWidth={1.7} />
              <div className="min-w-0 flex-1">
                <p className="font-caption text-[9px] uppercase tracking-[0.14em] text-text-dim">
                  {incident.severity} · {incident.source} · {incident.status}
                </p>
                <p className="mt-1 font-body text-sm leading-relaxed text-text">{incident.message}</p>
                <p className="mt-1 font-body text-xs text-text-dim">
                  {incident.route} · seen {incident.occurrence_count}x
                </p>
                {incident.linear_issue_url ? (
                  <a
                    href={incident.linear_issue_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 font-caption text-[9px] uppercase tracking-[0.14em] text-gold"
                  >
                    {incident.linear_issue_identifier ?? 'Linear issue'}
                    <ExternalLink className="h-3 w-3" strokeWidth={1.7} />
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}

        {health.updates.map((update) => (
          <article key={update.id} className="rounded-sm border border-border bg-bg/70 p-3">
            <p className="font-caption text-[9px] uppercase tracking-[0.14em] text-text-dim">
              Fix published
            </p>
            <p className="mt-1 font-body text-sm leading-relaxed text-text">{update.title}</p>
            <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">{update.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
