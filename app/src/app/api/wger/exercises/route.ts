import { NextRequest, NextResponse } from 'next/server';
import { fetchWgerExercises } from '@/lib/wger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? 12);

  const payload = await fetchWgerExercises({
    query,
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 30) : 12,
  });

  return NextResponse.json(payload);
}
