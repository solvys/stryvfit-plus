# cal.com self-host on Fly.io

Deploys cal.com OSS at `cal.stryvsocietyfit.com`, embedded by the StryvFit+ PWA.

## 1. Provision

```bash
git clone https://github.com/calcom/cal.com cal-stryv
cd cal-stryv
fly launch --name cal-stryv --region mia --no-deploy
fly postgres create --name cal-stryv-db --region mia
fly postgres attach cal-stryv-db --app cal-stryv
```

## 2. Required secrets (fly secrets set ...)

```
NEXTAUTH_SECRET=<openssl rand -base64 32>
CALENDSO_ENCRYPTION_KEY=<openssl rand -base64 32>
NEXT_PUBLIC_WEBAPP_URL=https://cal.stryvsocietyfit.com
NEXTAUTH_URL=https://cal.stryvsocietyfit.com
GOOGLE_API_CREDENTIALS=<service account json, single line>
STRIPE_PRIVATE_KEY=<sk_live_...>
STRIPE_WEBHOOK_SECRET=<whsec_...>
SENDGRID_API_KEY=<sg_...>
EMAIL_FROM=hello@stryvsocietyfit.com
```

## 3. DNS

Squarespace DNS:
- `cal` CNAME → `cal-stryv.fly.dev`
- `book` CNAME → `cal-stryv.fly.dev` (cal.com supports custom domain per username)

## 4. Event types

Create as user `stryv` after first login:
- `free-first-session` — 60 min, free, no payment, public on `/stryv/free-first-session`
- `coaching-session` — 60 min, gated to coaching tier (price hidden, paid via subscription)
- `premium-session` — 60 min, gated to premium tier

## 5. Webhook back to PWA

cal.com → Settings → Developer → Webhooks:
- URL: `https://app.stryvsocietyfit.com/api/cal/webhook`
- Secret: matches `CAL_WEBHOOK_SECRET` in PWA env
- Events: `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`, `MEETING_ENDED`

## 6. Embed in PWA

`@calcom/embed-react` with `calOrigin=https://cal.stryvsocietyfit.com` and
`calLink=stryv/<slug>`. Theme tokens injected via `cssVarsPerTheme.dark` to
match Solvys Gold (#c79f4a on #050402).
