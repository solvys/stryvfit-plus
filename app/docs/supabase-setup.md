# StryvFit+ Supabase Setup

## 1. Create the project

Create a Supabase project for `StryvFit+`.

Recommended local project defaults:

- App URL: `http://localhost:3001`
- Production URL: `https://app.stryvsocietyfit.com`
- Database schema: `public`

## 2. Copy environment values

In Supabase Dashboard, open Project Settings -> API and copy:

- Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
- anon/public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role key -> `SUPABASE_SERVICE_ROLE_KEY`

Create `app/.env.local` from `.env.example` and fill those values.

## 3. Apply the database migration

Option A, dashboard:

1. Open SQL Editor.
2. Paste `supabase/migrations/20260512195556_init_stryvfit_core.sql`.
3. Run it once.

Option B, CLI:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## 4. Verify the required tables

Run this in SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'app_settings',
    'cal_bookings',
    'trainer_notes',
    'meal_orders'
  )
order by table_name;
```

Expected rows:

- `app_settings`
- `cal_bookings`
- `meal_orders`
- `profiles`
- `trainer_notes`

## 5. Configure trainer settings

Start the app:

```bash
bun run dev
```

Open:

```text
http://localhost:3001/admin/settings
```

Save:

- Trainer name
- Trainer phone in E.164 format, for example `+13053479816`

Then verify:

```text
http://localhost:3001/coach
```

The Coach tab should show the iMessage CTA.

## 6. Configure Cal webhook

Set `CAL_WEBHOOK_SECRET` in `.env.local` and in your Cal webhook provider.

Webhook endpoint:

```text
https://app.stryvsocietyfit.com/api/cal/webhook
```

For local tunnel testing, point Cal at the tunnel URL ending in:

```text
/api/cal/webhook
```

Bookings should upsert into `public.cal_bookings`.
