# Solvys Support Protocol

SSFitness includes a support engine that turns admin/user-reported issues into tracked Solvys work.

## Components

- `AdminSupportChat`: quick support request form in admin surfaces.
- `/api/incidents`: captures incidents, dedupes by fingerprint, files Linear issues, and returns System Health data.
- `SystemHealthPanel`: shows setup errors, open incidents, Linear links, and published update records.
- `/api/incidents/sync-resolution`: marks incidents resolved and inserts app update records after fixes ship.
- `scripts/smoke-support-pipeline.mjs`: dry-run and live smoke testing.

## Incident Flow

1. Admin files a support request or the app reports an incident.
2. The incident is validated and fingerprinted.
3. Existing open incidents with the same fingerprint are deduped and occurrence count is incremented.
4. New incidents are inserted into Supabase as `open`.
5. The app attempts to file a Linear issue using Solvys env configuration.
6. If Linear succeeds, incident status becomes `filed` with issue id, identifier, and URL.
7. If Linear fails, incident status becomes `linear_failed` and the error is stored in `raw_payload`.
8. System Health displays open, filed, in-progress, and failed incidents.
9. When a fix ships, `/api/incidents/sync-resolution` records the app update and resolves the incident.

## Severity Guide

- Low: cosmetic issue, typo, small UI mismatch, no blocked workflow.
- Medium: degraded admin/client flow with a workaround.
- High: core booking, meal, workout, or support function is broken.
- Critical: production outage, data exposure risk, payment lockout failure, or client-visible publishing failure affecting multiple users.

## Required Environment

Support capture and Linear filing depend on:

```bash
INCIDENT_WEBHOOK_SECRET=
LINEAR_API_KEY=
LINEAR_DEFAULT_ASSIGNEE_ID=
LINEAR_SOLVYS_TEAM_ID=
LINEAR_SOLVYS_PROJECT_ID=
LINEAR_INCIDENT_LABEL_IDS=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`INCIDENT_WEBHOOK_SECRET` protects external mutation calls. Same-origin admin requests are allowed by the route when configured.

## Smoke Tests

From `app/`:

```bash
bun run smoke:support
```

This checks dry-run validation, Linear priority mapping, and health endpoint shape.

Use live mode only when TP expects a real incident and Linear ticket:

```bash
RUN_LIVE_INCIDENT_SMOKE=1 bun run smoke:support
```

## When System Health Says Setup Needed

1. Open `/admin/pulse` or `/admin/workouts` and read the System Health error.
2. Check Supabase envs first because System Health reads `support_incidents` and `app_update_records`.
3. If incident capture works but Linear filing fails, check Linear envs.
4. If external sync-resolution calls fail, check `INCIDENT_WEBHOOK_SECRET`.
5. Run `bun run smoke:support`.
6. Report exact missing env/service status to TP. Do not say "all clear" until the health endpoint returns arrays without an error.

## Filing A Support Request In ChatGPT

Ask:

```text
Chat, file a high support request: the workout builder is not loading wger exercises.
```

ChatGPT should:

- Open the relevant admin page.
- Use the Support Request form if UI control is requested.
- Choose the correct severity.
- Submit.
- Refresh System Health.
- Report whether the incident was captured, deduped, and filed to Linear.

## Fix Publication Protocol

After a support fix ships, call `/api/incidents/sync-resolution` with either `incident_id` or `linear_issue_id`.

Payload shape:

```json
{
  "incident_id": "incident uuid",
  "linear_issue_id": "optional Linear issue id",
  "linear_issue_url": "optional Linear URL",
  "title": "Fix title",
  "summary": "Short operator-readable summary",
  "commit_sha": "optional commit sha"
}
```

Include header:

```text
x-incident-secret: INCIDENT_WEBHOOK_SECRET
```

This creates an `app_update_records` row and resolves the matching incident if found.
