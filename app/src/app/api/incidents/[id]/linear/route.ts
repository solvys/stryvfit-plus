import { NextResponse } from 'next/server';
import { createLinearIssueForIncident } from '@/lib/linear';
import { serviceClient } from '@/lib/supabase';
import type { StoredIncident } from '@/lib/incidents';

export const runtime = 'nodejs';

function isAuthorized(req: Request): boolean {
  const secret = process.env.INCIDENT_WEBHOOK_SECRET;
  return Boolean(secret && req.headers.get('x-incident-secret') === secret);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const sb = serviceClient();
  const { data, error } = await sb
    .from('support_incidents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'incident not found' }, { status: 404 });
  }

  if (data.linear_issue_id) {
    return NextResponse.json({ incident: data, skipped: true });
  }

  try {
    const issue = await createLinearIssueForIncident(data as StoredIncident);
    const updated = await sb
      .from('support_incidents')
      .update({
        status: 'filed',
        linear_issue_id: issue.id,
        linear_issue_identifier: issue.identifier,
        linear_issue_url: issue.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updated.error) throw updated.error;
    return NextResponse.json({ incident: updated.data, issue });
  } catch (err) {
    await sb
      .from('support_incidents')
      .update({
        status: 'linear_failed',
        raw_payload: {
          ...(typeof data.raw_payload === 'object' && data.raw_payload ? data.raw_payload : {}),
          linear_error: err instanceof Error ? err.message : 'Linear filing failed',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Linear filing failed' },
      { status: 500 }
    );
  }
}
