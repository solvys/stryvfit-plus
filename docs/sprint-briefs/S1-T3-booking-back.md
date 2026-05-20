# S1-T3: Booking Back — Confirm, Success, Cancel

**Sprint:** 1 — Core Booking Experience
**Track:** 3 of 4
**Dependencies:** T1 must be complete (types, design tokens, UI components)
**Project:** StryvDash — Custom booking webapp for Stryv Society Fitness

---

## Context

You are building the back half of the client-facing booking flow: the confirmation/payment page, the success page, and the cancel/reschedule page. After a client picks a service and time (T2's pages), they land on YOUR pages to review, pay, and get confirmed.

The success page is a celebration moment — not a boring receipt. The cancel flow must be accessible via HMAC-signed links with no login required.

**Brand direction:** Dark athletic aesthetic. Orange (#F24F09) used surgically. Bold typography. Confident motion. Every element placed with purpose.

---

## Files to Read First

Before writing any code, read these files created by T1:
- `src/types/index.ts` — all shared interfaces (especially `BookingFormData`, `Service`, `Booking`)
- `src/styles/globals.css` — design tokens
- `src/components/ui/*` — Button, Card, Input components
- `src/lib/supabase.ts` — Supabase client
- `src/lib/animations.ts` — shared animation variants

---

## Files to Create

### Confirm + Pay Page (`/confirm`)
- `src/app/confirm/page.tsx` — Review booking + client form + pay
- `src/components/booking/BookingSummary.tsx` — Service/time review card
- `src/components/booking/ClientForm.tsx` — Name, email, phone form

### Success Page (`/success`)
- `src/app/success/page.tsx` — Booking confirmation display
- `src/components/booking/ConfirmationCard.tsx` — Confirmed booking details
- `src/components/booking/AddToCalendar.tsx` — .ics download + Google Cal link

### Cancel/Reschedule Page (`/cancel`)
- `src/app/cancel/page.tsx` — HMAC-verified cancel/reschedule flow
- `src/components/booking/CancelFlow.tsx` — Cancel vs reschedule UI

### Shared Utilities
- `src/lib/stripe.ts` — Create checkout session (calls Supabase Edge Function)
- `src/lib/ics.ts` — Generate .ics calendar file
- `src/lib/hmac.ts` — HMAC verification (client-side verify only)

---

## Confirm Page Spec (`/confirm?service={id}&date={ISO}&time={ISO}`)

### Data
- Read service ID, date, time from URL searchParams
- Fetch service details from Supabase
- Display review + form

### Layout

```
┌─────────────────────────────────────┐
│  ← Back to Schedule                 │
│                                     │
│  CONFIRM YOUR SESSION  (Bebas H1)   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  BOOKING SUMMARY            │    │
│  │  ───────────────────────    │    │
│  │  Service: 1-on-1 Training   │    │
│  │  Date:    Tuesday, Apr 15   │    │
│  │  Time:    10:30 AM EST      │    │
│  │  Duration: 60 minutes       │    │
│  │  ───────────────────────    │    │
│  │  Total:           $75.00    │    │
│  └─────────────────────────────┘    │
│                                     │
│  YOUR INFO                          │
│  ┌─────────────────────────────┐    │
│  │  Name *         [________]  │    │
│  │  Email *        [________]  │    │
│  │  Phone          [________]  │    │
│  │  Notes          [________]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  [BOOK & PAY  →  $75]              │
│                                     │
│  (fine print: cancellation policy)  │
└─────────────────────────────────────┘
```

### BookingSummary.tsx
- Card component with service details
- Service name: Oswald H3
- Date/time: DM Sans, `text` color
- Price: Space Grotesk, large (28px), right-aligned
- Divider: 1px `border` line
- Background: `surface-2`

### ClientForm.tsx
- Fields: name (required), email (required), phone (optional), notes (optional)
- Use Input components from T1
- Client-side validation: name not empty, email valid format, phone optional
- Labels: Oswald, small, `text-muted`, uppercase
- Error messages: DM Sans, `primary` (orange) color, small

### "Book & Pay" Button
- Primary button, full-width
- Shows price in the button text
- On click:
  1. Validate form
  2. Call `createCheckoutSession()` (lib/stripe.ts)
  3. Redirect to Stripe Checkout URL
- Loading state: spinner + "Processing..." text
- Disabled until form is valid

### Cancellation Policy (fine print)
- Below the button, small text in `text-dim`
- "Free cancellation up to 24h before. 50% refund 12-24h before. No refund under 12h."

---

## Stripe Integration (`src/lib/stripe.ts`)

```typescript
interface CreateCheckoutParams {
  serviceId: string;
  startsAt: string;      // UTC ISO
  endsAt: string;        // UTC ISO
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string>
// Calls Supabase Edge Function: POST /functions/v1/create-checkout
// Body: params
// Returns: Stripe Checkout URL (redirect to it)
// The Edge Function creates a pending booking row + Stripe session
```

---

## Success Page Spec (`/success?session_id={CHECKOUT_SESSION_ID}`)

### Data
- Read `session_id` from URL
- Fetch booking details from Supabase using the session_id (via a query or Edge Function)
- Handle case where booking isn't found yet (webhook delay) — show loading state, poll for 5 seconds

### Layout — This Is a Celebration

This is NOT a boring receipt page. The client just committed to investing in themselves. Make it feel earned.

```
┌─────────────────────────────────────┐
│                                     │
│         YOU'RE BOOKED.              │
│         (Bebas Neue, large)         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ConfirmationCard            │    │
│  │  ────────────────────────   │    │
│  │  1-on-1 Personal Training   │    │
│  │  Tuesday, April 15, 2026    │    │
│  │  10:30 AM — 11:30 AM EST   │    │
│  │  ────────────────────────   │    │
│  │  Trainer: [Name]            │    │
│  │  ────────────────────────   │    │
│  │  Confirmation sent to:      │    │
│  │  client@email.com           │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──────────┐ ┌──────────────┐     │
│  │ ADD TO   │ │ ADD TO GOOGLE│     │
│  │ CALENDAR │ │ CALENDAR     │     │
│  │ (.ics)   │ │ (link)       │     │
│  └──────────┘ └──────────────┘     │
│                                     │
│  Need to cancel or reschedule?     │
│  Check your confirmation email.     │
│                                     │
│  [BOOK ANOTHER SESSION]            │
└─────────────────────────────────────┘
```

### Entrance Animation
- Page fades in with a slight scale-up (springModal from animations.ts)
- "YOU'RE BOOKED." text animates in with a confident stagger
- Confirmation card slides up (fadeUp)
- Calendar buttons fade in after card

### ConfirmationCard.tsx
- Gold (`primary`) left border accent (4px)
- Background: `surface-2`
- All details in clean type hierarchy
- No clutter — just the facts

### AddToCalendar.tsx
- Two buttons side by side (secondary variant)
- `.ics download` — generates and downloads an .ics file
- `Google Calendar` — opens Google Calendar create event URL with prefilled data
- Icons: Lucide `Calendar` and `ExternalLink`

---

## .ics Generation (`src/lib/ics.ts`)

```typescript
interface IcsEvent {
  title: string;         // "Training: 1-on-1 Personal Training"
  description: string;   // Service + trainer details
  startDate: Date;
  endDate: Date;
  location?: string;
}

export function generateIcs(event: IcsEvent): string
// Returns valid .ics file content string

export function downloadIcs(event: IcsEvent): void
// Creates blob, triggers download as "stryvdash-booking.ics"

export function googleCalendarUrl(event: IcsEvent): string
// Returns https://calendar.google.com/calendar/render?action=TEMPLATE&...
```

---

## Cancel Page Spec (`/cancel?booking={id}&token={hmac}`)

### HMAC Verification
- The cancel link is sent in the confirmation email
- URL contains booking ID + HMAC token
- Client-side: verify the HMAC matches (using a public verification endpoint or client-side check)
- If invalid: show "Invalid or expired link" error
- If valid: show the cancel/reschedule flow

### Layout

```
┌─────────────────────────────────────┐
│  MANAGE YOUR BOOKING                │
│                                     │
│  [Booking details summary]          │
│                                     │
│  ┌────────────┐ ┌────────────┐     │
│  │  CANCEL    │ │ RESCHEDULE │     │
│  │  SESSION   │ │ SESSION    │     │
│  └────────────┘ └────────────┘     │
│                                     │
│  [Selected action flow below]       │
└─────────────────────────────────────┘
```

### Cancel Flow
1. Show booking details
2. Show refund amount based on cancellation policy + time until session
3. "Confirm Cancellation" button (destructive style: `deep` color bg)
4. On confirm: call Edge Function to cancel booking
5. Show "Booking Cancelled" confirmation with refund info

### Reschedule Flow
1. Show booking details
2. "Choose a new time" — embeds the same Calendar + TimeSlots from T2
3. On new time selected: call Edge Function to update booking
4. Show "Booking Rescheduled" confirmation

### HMAC Client-Side (`src/lib/hmac.ts`)

```typescript
// Client-side verification helper
// The actual HMAC generation happens server-side (T4's Edge Functions)
// This file provides the verification URL builder and token parser

export function parseCancelUrl(url: string): { bookingId: string; token: string } | null

export function buildCancelUrl(bookingId: string, token: string): string
```

---

## Verification

```bash
npx tsc --noEmit
npx next build
ls out/confirm.html
ls out/success.html
ls out/cancel.html
```

---

## Changelog Entry

```typescript
{ date: '2026-04-13T00:00:00', agent: 'claude-code', summary: 'S1-T3: Confirm/pay page, success celebration page, HMAC cancel/reschedule flow for StryvDash', files: ['src/app/confirm/page.tsx', 'src/app/success/page.tsx', 'src/app/cancel/page.tsx', 'src/components/booking/BookingSummary.tsx', 'src/components/booking/ClientForm.tsx', 'src/components/booking/ConfirmationCard.tsx', 'src/components/booking/AddToCalendar.tsx', 'src/components/booking/CancelFlow.tsx', 'src/lib/stripe.ts', 'src/lib/ics.ts', 'src/lib/hmac.ts'] }
```

---

## DO NOT

- Do NOT create or modify any files in `src/components/ui/` — T1 owns those
- Do NOT create service selection or schedule pages — T2 owns those
- Do NOT write Supabase Edge Functions or migrations — T4 owns those
- Do NOT handle Stripe webhooks — T4 owns server-side Stripe logic
- Do NOT create admin pages — Sprint 2 owns those
- Do NOT exceed 300 lines in any single file
- Do NOT use default Tailwind colors or shadows — only design tokens
