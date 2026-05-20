import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { CoachCTA } from '@/components/settings/CoachCTA';
import { serviceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getTrainerPhone(): Promise<string | null> {
  try {
    const sb = serviceClient();
    const { data } = await sb.from('app_settings').select('trainer_phone').eq('id', 1).single();
    return (data?.trainer_phone as string | null) ?? null;
  } catch {
    return null;
  }
}

export default async function CoachPage() {
  const phone = await getTrainerPhone();
  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-section text-3xl tracking-normal">YOUR COACH</h1>
        <p className="font-body text-sm text-text-muted mt-1">
          Direct line to Sam via iMessage. Replies during business hours.
        </p>
      </header>
      <Card>
        <CoachCTA phone={phone} />
      </Card>
    </AppShell>
  );
}
