# S1-T2: Booking Front — Service Selection + Schedule

**Sprint:** 1 — Core Booking Experience
**Track:** 2 of 4
**Dependencies:** T1 must be complete (types, design tokens, UI components)
**Project:** StryvDash — Custom booking webapp for Stryv Society Fitness

---

## Context

You are building the client-facing front half of the booking flow: the service selection page (landing) and the schedule/time-picker page. These are the first two screens any client sees. They must be fast, mobile-first, and feel premium — not like a generic booking widget.

**Brand direction:** Dark athletic aesthetic. Orange (#F24F09) used surgically — max 3 orange elements per viewport. Bold typography (Bebas Neue hero, Oswald subheaders, DM Sans body). Confident motion (200ms ease, no bounce). Every element placed with purpose.

**The booking flow:** Service Selection → Schedule → Confirm/Pay → Success. You own the first two steps.

---

## Files to Read First

Before writing any code, read these files created by T1:
- `src/types/index.ts` — all shared interfaces
- `src/styles/globals.css` — design tokens as CSS custom properties
- `tailwind.config.ts` — Tailwind theme mapping
- `src/components/ui/Button.tsx` — use this, don't create your own
- `src/components/ui/Card.tsx` — use this, don't create your own
- `src/components/ui/Skeleton.tsx` — for loading states
- `src/lib/supabase.ts` — Supabase client
- `src/lib/animations.ts` — shared animation variants
- `src/app/layout.tsx` — root layout (your pages render inside this)

---

## Files to Create

### Service Selection Page (Landing — `/`)
- `src/app/page.tsx` — Service selection page (main entry)
- `src/components/booking/ServiceCard.tsx` — Individual service card
- `src/components/booking/ServiceGrid.tsx` — Editorial layout container

### Schedule Page (`/schedule?service={id}`)
- `src/app/schedule/page.tsx` — Date + time slot selection
- `src/components/booking/Calendar.tsx` — Custom date picker
- `src/components/booking/TimeSlots.tsx` — Available time slots display
- `src/components/booking/TimezoneSelect.tsx` — Timezone override

### Shared Logic
- `src/lib/availability.ts` — Slot calculation engine
- `src/lib/timezone.ts` — Timezone detection + conversion helpers

---

## Service Selection Page Spec (`/`)

### Data
- Fetch active services from Supabase: `select * from services where is_active = true order by sort_order`
- Show loading skeletons while fetching

### Layout (Anti-Default — NOT a Uniform Grid)
This is the most important design decision on this page. Do NOT render identical cards in a 2-column grid. Instead:

**Mobile (< 768px):**
- Full-width stacked cards
- First service (hero service) gets a larger treatment: bigger text, more padding, featured badge
- Remaining services: slightly smaller, consistent but not identical to hero

**Desktop (768px+):**
- Asymmetric layout: hero service takes 60% width left, remaining services stack 40% right
- OR: 2-column with the hero service spanning full width above

### ServiceCard.tsx
```
┌─────────────────────────────────────┐
│  SERVICE NAME          (Oswald H3)  │
│  60 min · 1-on-1     (DM Sans dim) │
│                                     │
│  Description text here in DM Sans.  │
│  Two lines max.       (text-muted)  │
│                                     │
│  $75              [SELECT →]        │
│  (Space Grotesk)  (Orange Button)   │
└─────────────────────────────────────┘
```

- Background: `surface-2`
- Border: 1px `border`, hover: 1px `primary` (orange)
- Price: Space Grotesk, 24px, `text` color
- Duration + type: DM Sans, `text-dim`
- CTA: "Select" button, primary variant
- Hover: card border transitions to orange (200ms), subtle shadow appears
- Click: navigates to `/schedule?service={id}`
- Entrance animation: staggered fadeUp from animations.ts

### Hero (top of page, above service cards)
- H1: "BOOK YOUR SESSION" in Bebas Neue, large (48px mobile, 64px desktop)
- Subtitle: "Stryv Society Fitness" in Oswald, `text-muted`
- Keep it tight — no hero image, no illustration. Just type.

---

## Schedule Page Spec (`/schedule?service={id}`)

### Data
- Read `service` param from URL searchParams
- Fetch service details from Supabase
- Fetch trainer availability windows
- Fetch existing bookings for the visible date range
- Fetch blocked dates
- Calculate available slots using `availability.ts`

### Layout

```
┌─────────────────────────────────────┐
│  ← Back                             │
│                                     │
│  SERVICE NAME          $75 · 60min  │
│  (Oswald H2)          (Caption)     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      CALENDAR PICKER        │    │
│  │  ◄  April 2026  ►          │    │
│  │  S  M  T  W  T  F  S       │    │
│  │        1  2  3  4  5       │    │
│  │  6  7  8  9  10 11 12      │    │
│  │  ...                        │    │
│  └─────────────────────────────┘    │
│                                     │
│  AVAILABLE TIMES                    │
│  ┌─────────┐ ┌─────────┐           │
│  │ MORNING │ │ AFTERNOON│           │
│  ├─────────┤ ├─────────┤           │
│  │ 6:00 AM │ │ 12:00 PM│           │
│  │ 7:00 AM │ │ 1:00 PM │           │
│  │ 8:00 AM │ │ 2:00 PM │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  [CONTINUE →]                       │
└─────────────────────────────────────┘
```

### Calendar.tsx
- Custom month calendar — NOT a third-party datepicker
- Show current month + ability to navigate forward (up to 8 weeks out)
- Cannot navigate to past
- Days with availability: `text` color, clickable
- Days without availability: `text-dim` color, not clickable
- Selected day: `primary` orange background, dark text
- Today: subtle `border` ring
- Hover on available day: `surface-3` background
- Font: DM Sans for day numbers
- Month/year header: Oswald, `text-muted`
- Navigation arrows: Lucide ChevronLeft/ChevronRight, `text-muted`, hover `primary`
- Animation: month transition slides left/right (200ms ease)

### TimeSlots.tsx
- Grouped by period: Morning (before 12pm), Afternoon (12pm-5pm), Evening (5pm+)
- Each group has a label in Oswald `text-dim`
- Slots as horizontal chips/pills
- Available slot: `surface-3` bg, `border`, `text-muted` text
- Hovered slot: `primary` border
- Selected slot: `primary` bg, dark text, spring scale animation (1.05 → 1.0)
- Unavailable: hidden (don't show unavailable slots, just show nothing for empty periods)
- Time format: 12-hour with AM/PM
- Display in client's detected timezone (auto-detect via Intl.DateTimeFormat)

### TimezoneSelect.tsx
- Small dropdown below the time slots
- Shows detected timezone with a small "change" link
- Lists common US timezones + UTC
- Font: DM Sans, `text-dim`

### "Continue" Button
- Fixed at bottom on mobile (sticky)
- Disabled until both date AND time are selected
- Navigates to `/confirm?service={id}&date={ISO}&time={ISO}`
- Primary button, full-width on mobile

---

## Availability Calculation (`src/lib/availability.ts`)

```typescript
interface AvailabilityInput {
  availabilityWindows: Availability[]; // trainer's weekly schedule
  existingBookings: Booking[];         // already booked slots
  blockedDates: BlockedDate[];         // holidays, vacation
  serviceDuration: number;             // minutes
  bufferMinutes: number;               // 15 min default
  date: Date;                          // the day to calculate for
  timezone: string;                    // client's timezone
}

// Returns array of available TimeSlots for the given date
export function getAvailableSlots(input: AvailabilityInput): TimeSlot[]
```

Logic:
1. Get the day_of_week for the requested date
2. Find matching availability windows for that day
3. Check if date is in blocked_dates — if so, return empty
4. Generate all possible slot start times within each window (every 30 min or based on duration)
5. For each potential slot, check if it overlaps with any existing booking (including buffer time)
6. Return only non-overlapping slots
7. All internal math in UTC, convert to display timezone for output

---

## Timezone Helpers (`src/lib/timezone.ts`)

```typescript
export function detectTimezone(): string
// Uses Intl.DateTimeFormat().resolvedOptions().timeZone

export function formatTimeInZone(date: Date, timezone: string): string
// "9:00 AM"

export function formatDateInZone(date: Date, timezone: string): string
// "Tuesday, April 15"

export function toUTC(date: Date, time: string, timezone: string): Date
// Combines date + time string in given timezone → UTC Date
```

---

## Verification

```bash
# Type check
npx tsc --noEmit

# Build
npx next build

# Check pages exist
ls out/index.html
ls out/schedule.html

# No hardcoded colors
grep -r "#F24F09\|#BF3612\|#731C13" src/app/page.tsx src/app/schedule/ src/components/booking/ --include="*.tsx" | grep -v "import"
```

---

## Changelog Entry

```typescript
{ date: '2026-04-13T00:00:00', agent: 'claude-code', summary: 'S1-T2: Service selection page with editorial layout + schedule page with calendar/time picker for StryvDash', files: ['src/app/page.tsx', 'src/app/schedule/page.tsx', 'src/components/booking/ServiceCard.tsx', 'src/components/booking/ServiceGrid.tsx', 'src/components/booking/Calendar.tsx', 'src/components/booking/TimeSlots.tsx', 'src/components/booking/TimezoneSelect.tsx', 'src/lib/availability.ts', 'src/lib/timezone.ts'] }
```

---

## DO NOT

- Do NOT create or modify any files in `src/components/ui/` — T1 owns those
- Do NOT create `src/app/confirm/`, `src/app/success/`, or `src/app/cancel/` — T3 owns those
- Do NOT write Supabase Edge Functions or database migrations — T4 owns those
- Do NOT install additional packages beyond what T1 installed
- Do NOT exceed 300 lines in any single file — split components if needed
- Do NOT use a third-party date picker library — build a custom one
- Do NOT use default Tailwind colors or shadows — only design tokens
