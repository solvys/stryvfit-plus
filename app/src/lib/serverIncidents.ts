import { createLinearIssueForIncident } from '@/lib/linear';
import { serviceClient } from '@/lib/supabase';
import {
  type IncidentPayload,
  type StoredIncident,
  fingerprintIncident,
} from '@/lib/incidents';

export async function captureServerIncident(input: Omit<IncidentPayload, 'fingerprint'> & { fingerprint?: string }) {
  const payload: IncidentPayload = {
    ...input,
    fingerprint:
      input.fingerprint ??
      fingerprintIncident({ source: input.source, route: input.route, message: input.message }),
  };

  const sb = serviceClient();
  const inserted = await sb
    .from('support_incidents')
    .insert({ ...payload, status: 'open', raw_payload: payload })
    .select('*')
    .single();

  if (inserted.error) throw inserted.error;

  try {
    const issue = await createLinearIssueForIncident(inserted.data as StoredIncident);
    await sb
      .from('support_incidents')
      .update({
        status: 'filed',
        linear_issue_id: issue.id,
        linear_issue_identifier: issue.identifier,
        linear_issue_url: issue.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inserted.data.id);
  } catch (error) {
    await sb
      .from('support_incidents')
      .update({
        status: 'linear_failed',
        raw_payload: {
          ...payload,
          linear_error: error instanceof Error ? error.message : 'Linear filing failed',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', inserted.data.id);
  }

  return inserted.data as StoredIncident;
}
