# S1-T1: Foundation + Design System

**Sprint:** 1 — Core Booking Experience
**Track:** 1 of 4
**Dependencies:** None (runs first)
**Project:** StryvDash — Custom booking webapp for Stryv Society Fitness

---

## Context

You are building the foundation for StryvDash, a premium booking webapp for a solo fitness trainer. This track scaffolds the entire Next.js project, defines all shared TypeScript types, creates the design token system, builds the UI component library, and establishes the layout shell.

Every other track in Sprint 1 depends on your output. Your types are the contract. Your design tokens are the source of truth. Your UI components are what every page uses.

**Brand direction:** Dark, athletic, bold. Think walking into a high-end gym at night. Orange is earned — max 3 orange elements per viewport. No gradients. No colored emojis. Every shadow, radius, and spacing value is intentional.

---

## Files to Read First

None — this is greenfield. Empty directory at `/Users/tifos/Desktop/SSFitness`.

---

## Files to Create

### Project Scaffold
- `package.json` — Next.js 14+, Tailwind CSS 4, framer-motion, @supabase/supabase-js, date-fns, lucide-react
- `next.config.js` — Static export for Cloudflare Pages (`output: 'export'`)
- `tsconfig.json` — Strict mode, path aliases (`@/` → `./src/`)
- `tailwind.config.ts` — Custom theme with all design tokens below
- `wrangler.toml` — Cloudflare Pages config (name: `stryvdash`, build output: `out`)
- `.env.example` — All env vars documented (no real values)
- `.gitignore` — Node, Next.js, .env

### Source Structure
- `src/types/index.ts` — All shared interfaces (see Type Definitions below)
- `src/lib/supabase.ts` — Supabase client (browser) + server helper
- `src/lib/animations.ts` — Shared framer-motion variants
- `src/lib/constants.ts` — App-wide constants (buffer time, timezone defaults, etc.)
- `src/app/layout.tsx` — Root layout: fonts, metadata, dark theme, page transition wrapper
- `src/styles/globals.css` — Tailwind directives, CSS custom properties, font faces, reset
- `src/components/ui/Button.tsx` — Primary, secondary, ghost variants
- `src/components/ui/Card.tsx` — Surface card with intentional shadow + border
- `src/components/ui/Input.tsx` — Text input with dark styling + focus ring
- `src/components/ui/Select.tsx` — Styled select dropdown
- `src/components/ui/Badge.tsx` — Status badges (confirmed, cancelled, etc.)
- `src/components/ui/Skeleton.tsx` — Loading skeleton with pulse animation
- `src/components/layout/Nav.tsx` — Top navigation bar
- `src/components/layout/Footer.tsx` — Minimal footer
- `src/components/layout/PageTransition.tsx` — framer-motion page transition wrapper

---

## Design Tokens (MANDATORY — Source of Truth)

```css
/* All tracks MUST use these tokens. Do NOT hardcode colors. */

/* Colors */
--bg:          #070E13;
--surface:     #0A0A0A;
--surface-2:   #111111;
--surface-3:   #1A1A1A;
--border:      #2A2520;
--primary:     #F24F09;   /* Vibrant orange */
--secondary:   #BF3612;   /* Burnt rust */
--deep:        #731C13;   /* Deep burgundy */
--text:        #F0EAD6;
--text-muted:  #8A8478;
--text-dim:    #5A5548;

/* Typography */
--font-hero:      'Bebas Neue', sans-serif;
--font-subheader: 'Oswald', sans-serif;
--font-body:      'DM Sans', sans-serif;
--font-caption:   'Space Grotesk', monospace;
```

### Tailwind Config Mapping
Map these to Tailwind classes:
- `bg-bg`, `bg-surface`, `bg-surface-2`, `bg-surface-3`
- `text-primary`, `text-secondary`, `text-deep`
- `text-body`, `text-muted`, `text-dim`
- `border-border`
- `font-hero`, `font-sub`, `font-body`, `font-caption`

### Typography Scale
| Role | Font | Size | Weight | Transform | Tracking |
|------|------|------|--------|-----------|----------|
| H1 Hero | Bebas Neue | 48px mobile / 64px desktop | 400 | uppercase | 3px |
| H2 Subheader | Oswald | 20px mobile / 24px desktop | 500 | uppercase | 1.5px |
| H3 Card title | Oswald | 16px mobile / 18px desktop | 500 | uppercase | 1px |
| Body | DM Sans | 16px | 400 | none | 0 |
| Body small | DM Sans | 14px | 400 | none | 0 |
| Caption | Space Grotesk | 12px | 400 | uppercase | 0.5px |
| Price | Space Grotesk | 28px | 600 | none | 0 |

### Animation Primitives (framer-motion)
```typescript
// lib/animations.ts
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
};

export const springModal = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring", stiffness: 300, damping: 24 }
};

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Confident easing — not bouncy, not linear
export const EASE_CONFIDENT = [0.25, 0.46, 0.45, 0.94];
```

---

## Type Definitions (MANDATORY — All Tracks Import These)

```typescript
// src/types/index.ts

export interface Trainer {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
}

export interface Service {
  id: string;
  trainer_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Availability {
  id: string;
  trainer_id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string;  // "06:00"
  end_time: string;    // "20:00"
  is_active: boolean;
}

export interface BlockedDate {
  id: string;
  trainer_id: string;
  blocked_date: string; // "2026-04-20"
  reason: string | null;
}

export interface Booking {
  id: string;
  service_id: string;
  trainer_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  starts_at: string;   // ISO 8601 UTC
  ends_at: string;     // ISO 8601 UTC
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  cancellation_reason: string | null;
  cancelled_at: string | null;
  google_event_id: string | null;
  notes: string | null;
  amount_cents: number;
  created_at: string;
  updated_at: string;
}

export interface BookingWithService extends Booking {
  service: Service;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface BookingFormData {
  client_name: string;
  client_email: string;
  client_phone?: string;
  notes?: string;
}

export interface AppSettings {
  buffer_minutes: number;
  cancellation_policy: {
    full_refund_hours: number;
    partial_refund_hours: number;
    partial_refund_percent: number;
  };
  timezone: string;
}
```

---

## UI Component Specs

### Button.tsx
- Variants: `primary` (orange bg, dark text), `secondary` (bordered, orange text), `ghost` (no border, muted text)
- Sizes: `sm`, `md`, `lg`
- Font: Oswald, uppercase, tracked
- Hover: `secondary` color (#BF3612) background on primary. Scale 1.01 with 200ms ease.
- Active: `deep` color (#731C13) with scale 0.99
- No default border-radius — use `rounded-sm` (2px) for sharp, intentional feel
- Full-width option via `fullWidth` prop

### Card.tsx
- Background: `surface-2` (#111111)
- Border: 1px `border` color
- No default shadow — shadow only on hover (custom: `0 4px 20px rgba(242,79,9,0.06)`)
- Radius: `rounded-sm` (2px)
- Padding: `p-5`

### Input.tsx
- Background: `surface-3` (#1A1A1A)
- Border: 1px `border`, focus: 1px `primary` (#F24F09)
- Text: `text` color, placeholder: `text-dim`
- Font: DM Sans
- Radius: `rounded-sm`
- Transition: border-color 200ms ease

---

## Layout Shell

### Nav.tsx
- Fixed top, full width
- Background: `bg` with backdrop-blur
- Left: "STRYVDASH" in Bebas Neue (hero font), orange on first letter
- Right: minimal — just a "Book Now" CTA on public pages
- Height: 56px mobile, 64px desktop
- Border-bottom: 1px `border`

### Footer.tsx
- Minimal: "Stryv Society Fitness" left, social links right
- Font: DM Sans, `text-dim` color
- Border-top: 1px `border`
- Padding: `py-6`

### PageTransition.tsx
- Wraps page content in framer-motion AnimatePresence
- Uses `pageTransition` variant from animations.ts

---

## Verification

```bash
# Type check
npx tsc --noEmit

# Build (static export)
npx next build

# Verify output exists
ls out/index.html

# Verify no hardcoded colors (should find 0 results)
grep -r "#F24F09\|#BF3612\|#731C13\|#070E13" src/components/ src/app/ --include="*.tsx" --include="*.ts" | grep -v "tokens\|config\|globals"
```

---

## Changelog Entry

```typescript
{ date: '2026-04-13T00:00:00', agent: 'claude-code', summary: 'S1-T1: Project scaffold, design tokens, shared types, UI components, layout shell for StryvDash', files: ['package.json', 'next.config.js', 'tsconfig.json', 'tailwind.config.ts', 'wrangler.toml', 'src/types/index.ts', 'src/lib/supabase.ts', 'src/lib/animations.ts', 'src/lib/constants.ts', 'src/styles/globals.css', 'src/app/layout.tsx', 'src/components/ui/*', 'src/components/layout/*'] }
```

---

## DO NOT

- Do NOT create any page routes beyond `layout.tsx` — other tracks own those
- Do NOT install Stripe or Google Calendar packages — T4 owns backend deps
- Do NOT write any Supabase queries — only the client initialization
- Do NOT use any color that isn't in the design tokens
- Do NOT use default Tailwind shadows, border-radius, or color values
- Do NOT exceed 300 lines in any single file
