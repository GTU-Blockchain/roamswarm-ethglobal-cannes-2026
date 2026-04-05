import { NextRequest, NextResponse } from 'next/server';

// World ID Developer Portal cloud verification
// Works with real Orb-verified users on any network.
// Docs: https://docs.world.org/api-reference/developer-portal/verify

const APP_ID = process.env.NEXT_PUBLIC_WORLDID_APP_ID!;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { merkle_root, nullifier_hash, proof, verification_level } = body;

  if (!merkle_root || !nullifier_hash || !proof) {
    return NextResponse.json({ error: 'Missing proof fields' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://developer.world.org/api/v2/verify/${APP_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merkle_root,
          nullifier_hash,
          proof,
          verification_level: verification_level ?? 'orb',
          action: 'register_contributor',
        }),
      }
    );

    const data = await res.json() as { success?: boolean; detail?: string; code?: string };

    if (!res.ok || !data.success) {
      console.error('[WorldID verify] Failed:', data);
      return NextResponse.json(
        { error: data.detail ?? data.code ?? 'Verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, nullifier_hash });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[WorldID verify] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
