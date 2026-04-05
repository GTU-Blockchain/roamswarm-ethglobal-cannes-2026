'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';

interface AgentStatus {
  name:   string;
  status: 'ok' | 'offline' | 'error';
  ens?:   string;
}

interface HealthResponse {
  swarm:  'ready' | 'degraded';
  agents: AgentStatus[];
}

const AGENT_ICONS: Record<string, string> = {
  orchestrator: '🧠',
  lore:         '📜',
  scout:        '🔍',
  guide:        '🎙',
};

export function SwarmStatus() {
  const [health, setHealth]   = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res  = await fetch('/api/agents/health');
        const data = await res.json() as HealthResponse;
        if (mounted) { setHealth(data); setLoading(false); }
      } catch {
        if (mounted) setLoading(false);
      }
    }
    check();
    const interval = setInterval(check, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (loading) return null;
  if (!health)  return null;

  const allOk = health.swarm === 'ready';

  return (
    <div
      className="rounded-2xl px-4 py-3 space-y-2"
      style={{
        background: allOk ? 'rgba(74,222,128,0.06)' : 'rgba(245,158,11,0.06)',
        border: `1px solid ${allOk ? 'rgba(74,222,128,0.2)' : 'rgba(245,158,11,0.2)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Radio size={13} className={allOk ? 'text-green-400' : 'text-amber-400'} />
        <span className="text-xs font-semibold" style={{ color: allOk ? '#4ade80' : '#fbbf24' }}>
          Swarm {allOk ? 'Ready' : 'Degraded'}
        </span>
      </div>

      {/* Agent dots */}
      <div className="flex items-center gap-3">
        {health.agents.map((agent) => (
          <div key={agent.name} className="flex items-center gap-1.5" title={agent.ens ?? agent.name}>
            <span className="text-sm">{AGENT_ICONS[agent.name] ?? '🤖'}</span>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: agent.status === 'ok' ? '#4ade80' : agent.status === 'offline' ? '#6b7280' : '#f87171',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
