import { NextRequest, NextResponse } from 'next/server';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const poiId = params.id;
  const lang = request.nextUrl.searchParams.get('lang') || 'en';
  const userId = request.nextUrl.searchParams.get('userId') || 'anonymous';

  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poiId, userId, lang }),
      signal: AbortSignal.timeout(180000), // 3 min max
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Orchestrator error: ${res.status} — ${err}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API /experience] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
