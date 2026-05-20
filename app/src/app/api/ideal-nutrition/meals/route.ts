import { NextResponse } from 'next/server';
import { fetchIdealNutritionMealsWithDiagnostics } from '@/lib/idealNutrition';
import { captureServerIncident } from '@/lib/serverIncidents';

export const runtime = 'nodejs';
export const revalidate = 1800;

export async function GET() {
  const result = await fetchIdealNutritionMealsWithDiagnostics();

  if (result.browserbase_error || result.direct_error) {
    await captureServerIncident({
      source: result.browserbase_error ? 'browserbase' : 'api',
      route: '/api/ideal-nutrition/meals',
      message: result.browserbase_error ?? result.direct_error ?? 'Ideal Nutrition ingestion degraded',
      severity: result.source === 'fallback' ? 'high' : 'medium',
      context: { source: result.source, direct_error: result.direct_error },
      admin_action: 'Auto-filed from Ideal Nutrition ingestion endpoint.',
    }).catch(() => null);
  }

  return NextResponse.json({
    source: 'idealnutritionnow.com',
    fetch_source: result.source,
    updated_at: new Date().toISOString(),
    meals: result.meals,
  });
}
