import { NextResponse } from 'next/server';

const AGENTS = [
  { name: 'orchestrator', url: process.env.ORCHESTRATOR_URL || 'http://localhost:3001' },
  { name: 'lore',         url: process.env.LORE_URL         || 'http://localhost:3002' },
  { name: 'scout',        url: process.env.SCOUT_URL        || 'http://localhost:3003' },
  { name: 'guide',        url: process.env.GUIDE_URL        || 'http://localhost:3004' },
];

export async function GET() {
  const results = await Promise.allSettled(
    AGENTS.map(async (agent) => {
      const res = await fetch(`${agent.url}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json() as { status: string; agent?: string };
      return { name: agent.name, status: data.status === 'ok' ? 'ok' : 'error', ens: data.agent };
    })
  );

  const statuses = results.map((r, i) => ({
    name:   AGENTS[i].name,
    status: r.status === 'fulfilled' ? (r.value.status as string) : 'offline',
    ens:    r.status === 'fulfilled' ? r.value.ens : undefined,
  }));

  const allOk = statuses.every((s) => s.status === 'ok');

  return NextResponse.json({ swarm: allOk ? 'ready' : 'degraded', agents: statuses });
}
