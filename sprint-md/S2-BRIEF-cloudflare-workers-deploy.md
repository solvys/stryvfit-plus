# Sprint Brief: S2 -- Cloudflare Workers Deployment (single-agent)

## Intent

Ship StryvFit+ and StryvAdmin on Cloudflare instead of Fly/Vercel/Framer. When this is done, the public website, client PWA, admin dashboard, API routes, service worker, and Linear incident endpoints should be deployable through Cloudflare Workers using the OpenNext Cloudflare adapter. The trainer/client should get stable Cloudflare-hosted URLs, while Solvys keeps Supabase and Linear as external services.

## Branch Target

`s2-cloudflare-workers-deploy`

## Scope -- Included

- [ ] Convert the existing Next.js app in `app/` to deploy on Cloudflare Workers through `@opennextjs/cloudflare`.
- [ ] Add Cloudflare deployment config: `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars`, static asset headers, and deploy/preview scripts.
- [ ] Update package dependencies and lockfile for `@opennextjs/cloudflare` and `wrangler`.
- [ ] Decide whether to remove or preserve `output: 'standalone'` in `next.config.js`; prefer Cloudflare/OpenNext compatibility over Docker/Fly leftovers.
- [ ] Verify all dynamic API routes still build for Cloudflare Workers:
  - `/api/incidents`
  - `/api/incidents/[id]/linear`
  - `/api/incidents/sync-resolution`
  - `/api/admin/settings`
  - `/api/wger/exercises`
  - `/api/cal/webhook`
- [ ] Update delivery docs to make Cloudflare the primary deployment path for both website and PWA/admin app.
- [ ] Keep Supabase as the source of truth and Linear as the support queue; do not migrate data to D1/KV in this sprint.
- [ ] Document Cloudflare secrets, custom domains, and production smoke steps.

## Scope -- Excluded (OUT OF BOUNDS)

- Do not rebuild the marketing site in Framer or Figma Sites.
- Do not migrate Supabase tables to Cloudflare D1.
- Do not replace Linear with Cloudflare queues or email.
- Do not redesign the PWA/admin UI.
- Do not remove the existing Fly Docker files unless Cloudflare preview/build passes and the docs clearly preserve rollback instructions elsewhere.
- Do not implement real Google Calendar OAuth scheduling; current themed Google handoff/mock flow stays intact.

## Known Issues to Preserve

- The current StryvFit+ client route is `/book?mock=v20&session=remote` for live preview/testing.
- The PWA and admin share one Next.js app under `app/`.
- Recent UI polish intentionally removed glossy pill effects and refined the remote workout badge/menu button; do not revert those CSS/component changes.
- `app/src/lib/changelog.ts` contains earlier Claude-code landing-page work and should be appended to if this project’s convention is still active.
- `docs/DELIVERY-SETUP-GUIDE.md` currently says Fly is primary and Cloudflare is optional; this must be corrected after Cloudflare is wired.
- Legacy `docs/sprint-briefs/S1-*` mention static Cloudflare Pages export. That is stale for the current app because the app now has dynamic API routes.

## Design Pass

### Layout / Interaction

No new user-facing UI is required. The only visible behavior change should be production hosting. After deployment, these URLs should continue to render the existing surfaces:

- `/` public website / landing page
- `/book` client PWA entry
- `/admin/pulse` StryvAdmin dashboard
- `/admin/workouts`
- `/admin/settings`

Keep the Stryv visual language exactly as-is. This is infrastructure work, not a design sprint.

### API / Service Shape

Use Cloudflare Workers as the runtime for the Next.js app through OpenNext.

Expected config shape:

- `wrangler.jsonc`
  - `main`: `.open-next/worker.js`
  - `name`: `stryvfit-plus`
  - `compatibility_date`: current stable date, at least `2024-09-23`
  - `compatibility_flags`: `nodejs_compat`, `global_fetch_strictly_public`
  - `assets.directory`: `.open-next/assets`
  - `assets.binding`: `ASSETS`
  - `services.WORKER_SELF_REFERENCE` bound to the same worker name
- `open-next.config.ts`
  - Use `defineCloudflareConfig`.
  - Start without R2 incremental cache unless the build/runtime requires it.
  - If ISR/cache support is needed, add an R2 bucket and document the binding.
- `public/_headers`
  - Cache immutable Next static assets.
  - Preserve service worker no-cache behavior either through Next headers or Cloudflare static headers.

Environment/secrets remain deployment concerns:

- Public env:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_APP_URL`
- Secrets:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `BROWSERBASE_API_KEY`
  - `INCIDENT_WEBHOOK_SECRET`
  - `LINEAR_API_KEY`
  - `LINEAR_DEFAULT_ASSIGNEE_ID`
  - `LINEAR_SOLVYS_TEAM_ID`
  - `LINEAR_SOLVYS_PROJECT_ID`
  - `LINEAR_INCIDENT_LABEL_IDS`
  - `WGER_API_TOKEN` if used
  - Stripe/Cal secrets if those routes are activated later

Fallback behavior:

- Missing Supabase env should keep `/api/incidents` health responses safe, not crash the whole app.
- Missing Linear env should keep dry support smoke available and surface a clear filing failure in incident status.
- Missing Browserbase/WGER env should preserve existing fallback behavior.

### Data / Agent Shape

No schema migration is expected. The next agent must verify the existing Supabase migrations remain the source of truth:

- `support_incidents`
- `app_update_records`
- client/admin settings tables from current migrations

RLS and service-role behavior remain Supabase-side. Cloudflare Workers should only receive service-role keys as secrets, never public env.

The Solvys support loop stays:

1. Client/admin captures incident.
2. `/api/incidents` dedupes in Supabase.
3. Server route creates Linear issue.
4. Scheduled Codex/Linear watcher publishes an `app_update_records` row.

### Aesthetic Rules

- No UI restyling in this sprint.
- Do not reintroduce glossy glass effects, heavy gradients, or shifting floating controls.
- If any deployment status UI is added, keep it inline and quiet.
- Do not add marketing badges, Cloudflare logos, or deployment chrome to the product.

## Development Flow

1. Inspect the current app deploy state:
   - Read `app/package.json`, `app/next.config.js`, `app/.env.example`, `app/Dockerfile`, `app/fly.toml`, `docs/DELIVERY-SETUP-GUIDE.md`, and `app/src/lib/changelog.ts`.
   - Confirm the current dynamic routes and Node runtime usage.

2. Add Cloudflare/OpenNext dependencies:
   - Add `@opennextjs/cloudflare` and `wrangler` as dev dependencies.
   - Run the package manager used by the repo, currently Bun.
   - Commit lockfile changes.

3. Add Cloudflare configuration:
   - Create `app/wrangler.jsonc`.
   - Create `app/open-next.config.ts`.
   - Create `app/.dev.vars` with only non-secret local development defaults such as `NEXTJS_ENV=development`.
   - Create or update `app/public/_headers`.
   - Add `.open-next` and Cloudflare generated type files to `app/.gitignore` as appropriate.

4. Update scripts:
   - Add `cf:preview`: `opennextjs-cloudflare build && opennextjs-cloudflare preview`.
   - Add `cf:deploy`: `opennextjs-cloudflare build && opennextjs-cloudflare deploy`.
   - Add `cf:upload`: `opennextjs-cloudflare build && opennextjs-cloudflare upload`.
   - Add `cf:typegen`: `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts`.
   - Preserve existing local scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `smoke:support`.

5. Normalize Next config for Cloudflare:
   - Remove or justify `output: 'standalone'`.
   - Keep `headers()` behavior for `/sw.js` if OpenNext respects it.
   - If OpenNext requires config changes for local bindings, add them with minimal disruption.

6. Build and compatibility pass:
   - Run standard gates first.
   - Run OpenNext build.
   - Fix Cloudflare runtime errors without changing product behavior.
   - Pay special attention to `node:crypto`, service-role Supabase calls, Linear API fetches, and service worker/static asset headers.

7. Documentation:
   - Update `docs/DELIVERY-SETUP-GUIDE.md` so Cloudflare Workers is primary for the app/admin/API.
   - Update `app/README.md` deploy section.
   - Document exact `wrangler secret put` or `wrangler secret bulk` flow.
   - Document custom domain plan:
     - `app.stryvsocietyfit.com` -> Cloudflare Worker route/custom domain
     - `book.stryvsocietyfit.com` -> same Worker, route to `/book` by DNS/redirect only if desired
     - `stryvsocietyfit.com` -> same Worker root or a future Pages marketing-only split

8. Changelog:
   - Append a compact entry to `app/src/lib/changelog.ts` if this repo continues using that file.

## Acceptance Criteria

- [ ] Existing Next build passes: `bun run build`.
- [ ] Lint passes: `bun run lint`.
- [ ] Typecheck passes: `bun run typecheck`.
- [ ] Unit tests pass: `bun test`.
- [ ] Support dry smoke passes: `bun run smoke:support`.
- [ ] OpenNext build passes: `bun run cf:preview` at least reaches a local Workers preview, or the exact blocker is documented.
- [ ] `/book?mock=v20&session=remote` renders in the Cloudflare preview runtime.
- [ ] `/admin/pulse` renders in the Cloudflare preview runtime.
- [ ] `/api/incidents?dry_run=1` or equivalent incident dry path behaves safely in the Cloudflare preview runtime.
- [ ] Static PWA files are served: `/manifest.webmanifest`, `/sw.js`, `/offline.html`.
- [ ] Deployment docs name Cloudflare Workers as primary and remove Fly/Vercel/Framer as the recommended default.
- [ ] Any remaining Cloudflare limitation is documented with exact command output and a recommended fallback.

## Validation Commands

Run from `app/`:

```bash
# Static gates
bun run lint
bun run typecheck
bun test
bun run smoke:support
bun run build

# Cloudflare/OpenNext build and local preview
bun run cf:preview

# If preview starts locally, smoke the key routes.
curl -fsS http://127.0.0.1:<preview-port>/book?mock=v20\\&session=remote >/dev/null
curl -fsS http://127.0.0.1:<preview-port>/admin/pulse >/dev/null
curl -fsS http://127.0.0.1:<preview-port>/manifest.webmanifest >/dev/null
curl -fsS http://127.0.0.1:<preview-port>/sw.js >/dev/null
```

If the Worker preview cannot run in this local environment, the agent must still run the OpenNext build command and capture the exact failure.

## Deployment Commands

After local gates pass:

```bash
cd app

# Login once.
wrangler login

# Set secrets one by one or by bulk file.
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put BROWSERBASE_API_KEY
wrangler secret put INCIDENT_WEBHOOK_SECRET
wrangler secret put LINEAR_API_KEY
wrangler secret put LINEAR_DEFAULT_ASSIGNEE_ID
wrangler secret put LINEAR_SOLVYS_TEAM_ID
wrangler secret put LINEAR_SOLVYS_PROJECT_ID
wrangler secret put LINEAR_INCIDENT_LABEL_IDS
wrangler secret put NEXT_PUBLIC_APP_URL
wrangler secret put WGER_API_BASE_URL

# Deploy.
bun run cf:deploy
```

## Commit Format

```bash
[v0.1.0] infra: S2 deploy StryvFit on Cloudflare Workers
```

## Linear Pending

Linear tools were not available in this session. Mirror this brief manually or with the Linear MCP when available.

Title:

```text
S2: Cloudflare Workers Deployment
```

Description summary:

```text
Move StryvFit+ and StryvAdmin from Fly/Vercel/Framer consideration to Cloudflare Workers using @opennextjs/cloudflare. Configure wrangler/open-next, scripts, secrets documentation, static asset headers, and validation gates. Brief path: @sprint-md/S2-BRIEF-cloudflare-workers-deploy.md
```

Acceptance:

```text
- Cloudflare/OpenNext config exists and builds.
- Existing lint/typecheck/test/support smoke/build pass.
- Cloudflare preview serves /book, /admin/pulse, /manifest.webmanifest, /sw.js.
- Delivery docs mark Cloudflare Workers as primary.
```
