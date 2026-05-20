import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

type CalWebhookEvent = {
  triggerEvent?: string;
  payload?: {
    bookingId?: string | number;
    uid?: string | number;
    eventType?: { slug?: string };
    type?: string;
    startTime?: string | null;
    endTime?: string | null;
    metadata?: { videoCallUrl?: string | null };
    additionalNotes?: string | null;
    attendees?: Array<{ email?: string | null; name?: string | null }>;
  };
};

function verify(body: string, signature: string | null): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verify(raw, req.headers.get('x-cal-signature-256'))) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }
  let event: CalWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const sb = serviceClient();

  const payload = event.payload ?? {};
  const cal_booking_id = String(payload.bookingId ?? payload.uid ?? '');
  if (!cal_booking_id) return NextResponse.json({ ok: true });

  const row = {
    cal_booking_id,
    cal_event_type: payload.eventType?.slug ?? payload.type ?? 'unknown',
    starts_at: payload.startTime ?? null,
    ends_at: payload.endTime ?? null,
    status:
      event.triggerEvent === 'BOOKING_CANCELLED'
        ? 'cancelled'
        : event.triggerEvent === 'BOOKING_RESCHEDULED'
          ? 'rescheduled'
          : 'confirmed',
    meeting_url: payload.metadata?.videoCallUrl ?? null,
    notes: payload.additionalNotes ?? null,
    client_email: payload.attendees?.[0]?.email ?? null,
    client_name: payload.attendees?.[0]?.name ?? null,
    raw: event,
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb
    .from('cal_bookings')
    .upsert(row, { onConflict: 'cal_booking_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
