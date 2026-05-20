# S1-T4: Backend — Supabase Schema + Edge Functions

**Sprint:** 1 — Core Booking Experience
**Track:** 4 of 4
**Dependencies:** T1 must be complete (types for reference only — this track has no UI)
**Project:** StryvDash — Custom booking webapp for Stryv Society Fitness

---

## Context

You are building the entire backend for StryvDash: database schema, Row Level Security policies, Supabase Edge Functions (Stripe checkout, webhook handling, email), and Google Calendar integration. This track has zero UI — you produce the data layer and API endpoints that all other tracks consume.

**Critical safety requirements:**
- Stripe webhook processing MUST be idempotent
- Double-booking prevention MUST use Postgres advisory locks
- All timestamps stored as UTC TIMESTAMPTZ
- Secrets in environment variables only — never hardcoded

---

## Files to Read First

- `src/types/index.ts` — shared TypeScript interfaces (your schema must match these)
- `.env.example` — environment variable names (created by T1)

---

## Files to Create

### Supabase Project Config
- `supabase/config.toml` — Local Supabase config

### Database Migrations
- `supabase/migrations/001_initial_schema.sql` — All tables
- `supabase/migrations/002_rls_policies.sql` — Row Level Security
- `supabase/migrations/003_indexes.sql` — Performance indexes
- `supabase/migrations/004_functions.sql` — Database functions (slot locking)

### Seed Data
- `supabase/seed.sql` — Trainer profile + sample services + availability

### Edge Functions
- `supabase/functions/create-checkout/index.ts` — Creates pending booking + Stripe Checkout session
- `supabase/functions/handle-webhook/index.ts` — Processes Stripe webhooks
- `supabase/functions/get-booking/index.ts` — Fetches booking by session_id (for success page)
- `supabase/functions/cancel-booking/index.ts` — Cancels booking (HMAC verified)
- `supabase/functions/reschedule-booking/index.ts` — Reschedules booking (HMAC verified)

### Integration Libraries (server-side)
- `src/lib/google-calendar.ts` — Google Calendar API helpers
- `src/lib/email-templates.ts` — Email HTML templates for Resend

---

## Database Schema

### 001_initial_schema.sql

```sql
-- Trainer profile
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Services offered
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recurring weekly availability
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Blocked dates
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  UNIQUE(trainer_id, blocked_date)
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  trainer_id UUID REFERENCES trainers(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','refunded','failed')),
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  google_event_id TEXT,
  notes TEXT,
  amount_cents INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook idempotency
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB
);

-- App settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  buffer_minutes INT DEFAULT 15,
  cancellation_policy JSONB DEFAULT '{"full_refund_hours":24,"partial_refund_hours":12,"partial_refund_percent":50}',
  timezone TEXT DEFAULT 'America/New_York',
  UNIQUE(trainer_id)
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 002_rls_policies.sql
```sql
-- Services: public read active, trainer manages all
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active services" ON services
  FOR SELECT USING (is_active = true);
CREATE POLICY "Trainer manages services" ON services
  FOR ALL USING (trainer_id IN (SELECT id FROM trainers WHERE email = auth.email()));

-- Bookings: public insert, trainer reads/updates own
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own booking by email" ON bookings
  FOR SELECT USING (true);  -- Controlled by Edge Functions, not direct client access
CREATE POLICY "Trainer reads own bookings" ON bookings
  FOR SELECT USING (trainer_id IN (SELECT id FROM trainers WHERE email = auth.email()));
CREATE POLICY "Trainer updates own bookings" ON bookings
  FOR UPDATE USING (trainer_id IN (SELECT id FROM trainers WHERE email = auth.email()));

-- Availability: public read, trainer manages
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read availability" ON availability
  FOR SELECT USING (is_active = true);
CREATE POLICY "Trainer manages availability" ON availability
  FOR ALL USING (trainer_id IN (SELECT id FROM trainers WHERE email = auth.email()));

-- Blocked dates: public read, trainer manages
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blocked dates" ON blocked_dates
  FOR SELECT USING (true);
CREATE POLICY "Trainer manages blocked dates" ON blocked_dates
  FOR ALL USING (trainer_id IN (SELECT id FROM trainers WHERE email = auth.email()));

-- Settings: trainer only
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer reads own settings" ON settings
  FOR SELECT USING (trainer_id IN (SELECT id FROM trainers WHERE email = auth.email()));
CREATE POLICY "Trainer updates own settings" ON settings
  FOR UPDATE USING (trainer_id IN (SELECT id FROM trainers WHERE email = auth.email()));

-- Trainers: public read basic info
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trainers" ON trainers FOR SELECT USING (true);
```

### 003_indexes.sql
```sql
CREATE INDEX idx_bookings_trainer_date ON bookings(trainer_id, starts_at);
CREATE INDEX idx_bookings_client_email ON bookings(client_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_stripe_session ON bookings(stripe_checkout_session_id);
CREATE INDEX idx_availability_trainer ON availability(trainer_id, day_of_week);
CREATE INDEX idx_services_trainer_active ON services(trainer_id, is_active);
```

### 004_functions.sql — Double-Booking Prevention
```sql
-- Check if a time slot is available (with advisory lock for race condition prevention)
CREATE OR REPLACE FUNCTION check_slot_available(
  p_trainer_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_buffer_minutes INT DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INT;
  lock_key BIGINT;
BEGIN
  -- Generate a deterministic lock key from trainer + hour
  lock_key := hashtext(p_trainer_id::text || date_trunc('hour', p_starts_at)::text);

  -- Acquire advisory lock (blocks concurrent checks for same slot)
  PERFORM pg_advisory_xact_lock(lock_key);

  -- Check for overlapping bookings (including buffer)
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE trainer_id = p_trainer_id
    AND status IN ('confirmed', 'completed')
    AND payment_status IN ('pending', 'paid')
    AND starts_at < (p_ends_at + (p_buffer_minutes || ' minutes')::INTERVAL)
    AND ends_at > (p_starts_at - (p_buffer_minutes || ' minutes')::INTERVAL);

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
```

---

## Seed Data (`supabase/seed.sql`)

```sql
-- Insert trainer
INSERT INTO trainers (id, name, email, bio, timezone) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Trainer Name',
  'trainer@stryvdash.com',
  'Personal trainer specializing in strength and conditioning.',
  'America/New_York'
);

-- Insert services
INSERT INTO services (trainer_id, name, description, duration_minutes, price_cents, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', '1-on-1 Personal Training', 'Full session focused on your goals. All fitness levels welcome.', 60, 7500, 1),
  ('00000000-0000-0000-0000-000000000001', 'Assessment Session', 'Initial fitness assessment and goal-setting consultation.', 45, 5000, 2),
  ('00000000-0000-0000-0000-000000000001', 'Express Training', 'Focused 30-minute high-intensity session.', 30, 4500, 3);

-- Insert weekly availability (Mon-Fri 6am-8pm, Sat 8am-2pm)
INSERT INTO availability (trainer_id, day_of_week, start_time, end_time) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, '06:00', '20:00'),
  ('00000000-0000-0000-0000-000000000001', 2, '06:00', '20:00'),
  ('00000000-0000-0000-0000-000000000001', 3, '06:00', '20:00'),
  ('00000000-0000-0000-0000-000000000001', 4, '06:00', '20:00'),
  ('00000000-0000-0000-0000-000000000001', 5, '06:00', '20:00'),
  ('00000000-0000-0000-0000-000000000001', 6, '08:00', '14:00');

-- Insert settings
INSERT INTO settings (trainer_id, buffer_minutes, timezone) VALUES
  ('00000000-0000-0000-0000-000000000001', 15, 'America/New_York');
```

---

## Edge Function: create-checkout

**Path:** `supabase/functions/create-checkout/index.ts`

**Request:**
```typescript
POST /functions/v1/create-checkout
{
  serviceId: string,
  startsAt: string,    // UTC ISO
  endsAt: string,      // UTC ISO
  clientName: string,
  clientEmail: string,
  clientPhone?: string,
  notes?: string
}
```

**Logic:**
1. Validate all required fields
2. Fetch service from DB, verify it exists and is active
3. Call `check_slot_available()` — if false, return 409 Conflict
4. Insert booking row with `payment_status: 'pending'`
5. Create Stripe Checkout Session:
   - `mode: 'payment'`
   - `line_items`: `[{ price_data: { currency, unit_amount, product_data: { name } }, quantity: 1 }]`
   - `metadata`: `{ booking_id, service_id, starts_at, client_email }`
   - `success_url`: `{APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `{APP_URL}/schedule?service={serviceId}`
   - `customer_email`: clientEmail
   - `expires_after`: 30 minutes
6. Update booking with `stripe_checkout_session_id`
7. Return `{ url: session.url }` (Stripe Checkout URL)

**Response:** `{ url: string }` or `{ error: string, code: number }`

---

## Edge Function: handle-webhook

**Path:** `supabase/functions/handle-webhook/index.ts`

**Request:** Raw Stripe webhook payload

**Logic:**
1. Verify Stripe signature using `stripe.webhooks.constructEvent()`
2. Check `webhook_events` table — if event ID exists, return 200 (idempotent)
3. Insert event ID into `webhook_events`
4. Handle event types:
   - `checkout.session.completed`:
     a. Extract `booking_id` from metadata
     b. Update booking: `payment_status = 'paid'`, store `payment_intent_id`
     c. Create Google Calendar event (via `google-calendar.ts`)
     d. Send confirmation email to trainer + client (via Resend)
     e. Generate HMAC cancel link, include in client email
   - `checkout.session.expired`:
     a. Update booking: `payment_status = 'failed'`, `status = 'cancelled'`
5. Return 200

**HMAC for cancel links:**
```typescript
import { createHmac } from 'node:crypto';
const token = createHmac('sha256', HMAC_SECRET)
  .update(bookingId)
  .digest('hex');
const cancelUrl = `${APP_URL}/cancel?booking=${bookingId}&token=${token}`;
```

---

## Edge Function: get-booking

**Path:** `supabase/functions/get-booking/index.ts`

**Request:** `GET /functions/v1/get-booking?session_id={stripe_session_id}`

**Logic:**
1. Query bookings by `stripe_checkout_session_id`
2. Join with services table for full details
3. Return booking + service data (no sensitive fields)

---

## Edge Function: cancel-booking

**Path:** `supabase/functions/cancel-booking/index.ts`

**Request:**
```typescript
POST /functions/v1/cancel-booking
{ bookingId: string, token: string }
```

**Logic:**
1. Verify HMAC token matches booking ID
2. Fetch booking, verify status is 'confirmed'
3. Calculate refund amount based on cancellation policy + time until session
4. If refund > 0: create Stripe refund
5. Update booking: `status = 'cancelled'`, `cancelled_at = now()`, `payment_status = 'refunded'` if applicable
6. Delete Google Calendar event
7. Send cancellation email to trainer + client
8. Return `{ success: true, refundAmount: number }`

---

## Edge Function: reschedule-booking

**Path:** `supabase/functions/reschedule-booking/index.ts`

**Request:**
```typescript
POST /functions/v1/reschedule-booking
{ bookingId: string, token: string, newStartsAt: string, newEndsAt: string }
```

**Logic:**
1. Verify HMAC token
2. Check new slot available via `check_slot_available()`
3. Update booking times
4. Update Google Calendar event
5. Send reschedule confirmation email
6. Return `{ success: true }`

---

## Google Calendar Integration (`src/lib/google-calendar.ts`)

```typescript
// Uses Google Calendar API with service account credentials
// Credentials stored in GOOGLE_CALENDAR_CREDENTIALS env var (JSON)

export async function createCalendarEvent(booking: Booking, service: Service): Promise<string>
// Returns Google event ID
// Event format:
// summary: "Training: {client_name} — {service_name}"
// description: includes client contact info + "Booked via StryvDash"
// start/end: from booking times
// reminders: popup 30 min before

export async function deleteCalendarEvent(eventId: string): Promise<void>

export async function updateCalendarEvent(eventId: string, newStart: string, newEnd: string): Promise<void>
```

---

## Email Templates (`src/lib/email-templates.ts`)

Uses Resend API. Simple HTML emails — dark background matching brand tokens.

```typescript
export function bookingConfirmationEmail(booking: Booking, service: Service, cancelUrl: string): { subject: string, html: string }
// To: client
// Subject: "Booking Confirmed — {service.name} on {date}"
// Body: details + add-to-calendar links + cancel/reschedule link

export function trainerNotificationEmail(booking: Booking, service: Service): { subject: string, html: string }
// To: trainer
// Subject: "New Booking: {client_name} — {service.name} on {date}"
// Body: client details + booking details

export function cancellationEmail(booking: Booking, refundAmount: number): { subject: string, html: string }
// To: client + trainer
// Subject: "Booking Cancelled — {date}"
// Body: cancellation details + refund info

export function reminderEmail(booking: Booking, service: Service): { subject: string, html: string }
// To: client
// Subject: "Reminder: Training session tomorrow at {time}"
// Body: session details + cancel link
```

---

## Environment Variables Required

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GOOGLE_CALENDAR_CREDENTIALS=   # JSON service account key
GOOGLE_CALENDAR_ID=            # trainer's calendar email
RESEND_API_KEY=
HMAC_SECRET=                   # 32 bytes hex, generated with: openssl rand -hex 32
NEXT_PUBLIC_APP_URL=           # https://book.stryvdash.com or dev URL
```

---

## Verification

```bash
# Validate SQL syntax
supabase db reset  # applies all migrations locally

# Type check Edge Functions
cd supabase/functions && npx tsc --noEmit

# Test create-checkout (Stripe test mode)
curl -X POST http://localhost:54321/functions/v1/create-checkout \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"...","startsAt":"...","endsAt":"...","clientName":"Test","clientEmail":"test@test.com"}'

# Test webhook (use Stripe CLI)
stripe listen --forward-to http://localhost:54321/functions/v1/handle-webhook
```

---

## Changelog Entry

```typescript
{ date: '2026-04-13T00:00:00', agent: 'claude-code', summary: 'S1-T4: Supabase schema, RLS, Edge Functions (checkout, webhook, cancel, reschedule), Google Calendar + email integration for StryvDash', files: ['supabase/migrations/*', 'supabase/functions/*', 'supabase/seed.sql', 'supabase/config.toml', 'src/lib/google-calendar.ts', 'src/lib/email-templates.ts'] }
```

---

## DO NOT

- Do NOT create any UI components or pages — you own backend only
- Do NOT modify `src/app/`, `src/components/`, or `src/styles/` — other tracks own those
- Do NOT hardcode any API keys, secrets, or credentials
- Do NOT use Supabase Realtime (out of scope for v1)
- Do NOT implement SMS notifications (email only for MVP)
- Do NOT exceed 300 lines in any single file
- Do NOT skip HMAC verification on cancel/reschedule endpoints
- Do NOT skip Stripe signature verification on webhooks
