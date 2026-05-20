import {
  type IncidentPayload,
  type StoredIncident,
  linearPriorityForSeverity,
} from '@/lib/incidents';

interface LinearIssue {
  id: string;
  identifier: string;
  url: string;
}

interface LinearGraphqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function linearGraphql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const apiKey = requiredEnv('LINEAR_API_KEY');
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API failed with ${response.status}`);
  }

  const data = (await response.json()) as LinearGraphqlResponse<T>;
  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join('; '));
  }
  if (!data.data) {
    throw new Error('Linear API returned no data');
  }
  return data.data;
}

function labelIdsForIncident(incident: IncidentPayload): string[] | undefined {
  const configured = process.env.LINEAR_INCIDENT_LABEL_IDS;
  if (!configured) return undefined;
  const ids = configured
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length ? ids : undefined;
}

function incidentDescription(incident: StoredIncident | IncidentPayload): string {
  const payload =
    'raw_payload' in incident
      ? incident.raw_payload
      : {
          source: incident.source,
          route: incident.route,
          severity: incident.severity,
          fingerprint: incident.fingerprint,
          context: incident.context,
          admin_action: incident.admin_action,
        };

  return [
    'Auto-filed SSFitness client incident.',
    '',
    `Severity: ${incident.severity}`,
    `Source: ${incident.source}`,
    `Route: ${incident.route}`,
    `Fingerprint: ${incident.fingerprint}`,
    'Labels: client-incident, ssf-pwa, severity-' + incident.severity,
    '',
    'Expected behavior:',
    'The StryvFit+ PWA should complete the requested admin/member flow without forcing the client to contact Solvys.',
    '',
    'Actual behavior:',
    incident.message,
    '',
    incident.stack ? ['Stack:', '```', incident.stack, '```'].join('\n') : '',
    'Raw payload:',
    '```json',
    JSON.stringify(payload, null, 2).slice(0, 9000),
    '```',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function createLinearIssueForIncident(
  incident: StoredIncident | IncidentPayload
): Promise<LinearIssue> {
  const teamId = requiredEnv('LINEAR_SOLVYS_TEAM_ID');
  const assigneeId = requiredEnv('LINEAR_DEFAULT_ASSIGNEE_ID');
  const projectId = process.env.LINEAR_SOLVYS_PROJECT_ID || undefined;
  const labelIds = labelIdsForIncident(incident);
  const title = `[SSFitness ${incident.severity}] ${incident.message}`.slice(0, 240);

  const data = await linearGraphql<{
    issueCreate: { success: boolean; issue: LinearIssue };
  }>(
    `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            url
          }
        }
      }
    `,
    {
      input: {
        teamId,
        assigneeId,
        projectId,
        labelIds,
        title,
        priority: linearPriorityForSeverity(incident.severity),
        description: incidentDescription(incident),
      },
    }
  );

  if (!data.issueCreate.success) {
    throw new Error('Linear issueCreate returned success=false');
  }

  return data.issueCreate.issue;
}
