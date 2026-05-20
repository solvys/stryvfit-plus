'use client';

import { useState } from 'react';
import { MessageSquarePlus, Send } from 'lucide-react';
import { fingerprintIncident, type IncidentSeverity } from '@/lib/incidents';

export function AdminSupportChat({ clientName }: { clientName: string }) {
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  async function submitSupportRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    setStatus('sending');
    const route = `${window.location.pathname}${window.location.search}`;
    const payload = {
      source: 'client' as const,
      route,
      message: cleanMessage,
      severity,
      fingerprint: fingerprintIncident({
        source: 'client',
        route,
        message: `admin-support:${cleanMessage}`,
      }),
      context: {
        clientName,
        supportSkill: '/solvys-support-install',
        requestedFrom: 'StryvAdmin quick support',
      },
      admin_action:
        'Route through the Solvys support workflow, file a Linear ticket, and assign it to the configured Solvys default owner.',
    };

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Support request failed');
      setMessage('');
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <section className="rounded-md border border-[#dedbd4] bg-white p-4">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-4 w-4 text-[#f24f09]" />
        <p className="font-caption text-[10px] uppercase tracking-[0.16em] text-[#817b72]">Support request</p>
      </div>
      <form onSubmit={submitSupportRequest} className="mt-3 space-y-3">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-24 w-full resize-none rounded-md border border-[#dedbd4] bg-[#fbfaf8] p-3 font-body text-sm leading-relaxed text-[#151515] outline-none transition focus:border-[#f24f09]"
          placeholder="Tell Solvys what broke"
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}
            className="min-h-10 rounded-md border border-[#dedbd4] bg-[#fbfaf8] px-3 font-caption text-[9px] uppercase tracking-[0.12em] text-[#151515] outline-none focus:border-[#f24f09]"
            aria-label="Support severity"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            type="submit"
            disabled={status === 'sending' || !message.trim()}
            className="ios-pill inline-flex min-h-10 items-center gap-2 rounded-full bg-[#151515] px-4 font-caption text-[9px] uppercase tracking-[0.13em] text-white transition hover:bg-[#f24f09] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="h-4 w-4" />
            {status === 'sending' ? 'Sending' : 'Send'}
          </button>
        </div>
        {status === 'sent' ? (
          <p className="font-body text-xs text-[#f24f09]">Sent to Solvys support.</p>
        ) : null}
        {status === 'failed' ? (
          <p className="font-body text-xs text-[#b83a14]">Could not send. System health will show setup issues.</p>
        ) : null}
      </form>
    </section>
  );
}
