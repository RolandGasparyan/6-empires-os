'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { FOUNDER_MODULES } from '@/founder/modules';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { GlassCard } from '@/components/ui/GlassCard';

// Client component — receives the resolved module slug as a plain prop.
export default function ModuleClient({ module }: { module: string }) {
  const def = FOUNDER_MODULES.find((m) => m.slug === module);
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (module === 'health') api.get('/system/health').then((r) => setData(r.data)).catch(() => {});
    if (module === 'logs') api.get('/system/logs').then((r) => setLogs(r.data.lines)).catch(() => {});
    if (module === 'openhuman') api.get('/openhuman/status').then((r) => setData(r.data)).catch(() => {});
    if (module === 'agents') api.get('/agents').then((r) => setData(r.data)).catch(() => {});
  }, [module]);

  function send() {
    if (!input.trim()) return;
    setChat((c) => [...c, { role: 'founder', text: input },
      { role: 'empire', text: 'Acknowledged. Routing to the intelligence core. (Connect an LLM endpoint to enable live responses.)' }]);
    setInput('');
  }

  if (!def) return <div className="absolute inset-0 grid place-items-center text-white/50">Unknown module</div>;

  return (
    <div className="absolute inset-0 overflow-auto bg-obsidian-radial scanlines p-6 md:p-10">
      <Link href="/founder" className="text-xs text-empire-gold/70 hover:text-empire-gold">← Command Center</Link>
      <div className="mt-3"><ModuleHeader eyebrow="Founder Module" title={def.name} status={def.desc} /></div>

      <div className="mt-6 max-w-4xl">
        {module === 'chat' && (
          <GlassCard className="p-4">
            <div className="h-72 overflow-auto space-y-3 mb-3">
              {chat.length === 0 && <div className="text-white/30 text-sm">Ask the Empire anything…</div>}
              {chat.map((m, i) => (
                <div key={i} className={m.role === 'founder' ? 'text-right' : ''}>
                  <span className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[80%] ${m.role === 'founder' ? 'bg-gold-500/15 text-empire-gold' : 'glass text-white/80'}`}>{m.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Message the Empire…" className="flex-1 bg-obsidian-900/70 border border-gold-500/20 rounded-lg px-3 py-2 text-sm text-white/90 outline-none focus:border-gold-500/50" />
              <button onClick={send} className="bg-gold-liquid animate-gold-flow text-obsidian-950 font-semibold text-sm px-4 rounded-lg">Send</button>
            </div>
          </GlassCard>
        )}

        {module === 'health' && data && (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.services.map((s: any) => (
              <GlassCard key={s.name} className="px-4 py-3 flex items-center justify-between">
                <span className="font-mono text-sm text-white/80">{s.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'healthy' ? 'bg-empire-success/15 text-empire-success' : 'bg-empire-danger/15 text-empire-danger'}`}>{s.status}</span>
              </GlassCard>
            ))}
          </div>
        )}

        {module === 'logs' && (
          <GlassCard className="p-4 font-mono text-xs text-white/60 h-96 overflow-auto">
            {logs.map((l, i) => <div key={i} className="py-0.5 border-b border-white/5">{l}</div>)}
          </GlassCard>
        )}

        {module === 'agents' && data && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.agents.map((a: any) => (
              <GlassCard key={a.id} className="px-4 py-3">
                <div className="flex justify-between"><span className="font-display font-bold text-empire-gold">{a.name}</span><span className="text-[10px] text-white/40 uppercase">{a.role}</span></div>
                <div className="mt-2 h-1 rounded-full bg-white/10"><div className="h-full bg-gold-liquid" style={{ width: `${a.load * 100}%` }} /></div>
              </GlassCard>
            ))}
          </div>
        )}

        {(module === 'openhuman') && (
          <GlassCard className="p-5">
            <div className="text-sm text-white/70">OpenHuman integration: <span className={data?.connected ? 'text-empire-success' : 'text-empire-danger'}>{data?.connected ? 'Connected' : 'Not connected'}</span></div>
            <p className="text-white/40 text-xs mt-2">Configure OAuth credentials (OPENHUMAN_CLIENT_ID / SECRET) on the API to enable health, activity & knowledge sync.</p>
          </GlassCard>
        )}

        {['ai', 'brain', 'memory', 'security'].includes(module) && (
          <GlassCard className="p-6">
            <p className="text-white/55 text-sm">{def.name} module — control surface wired to the API contract. Connect the corresponding backend service (vector DB / graph / LLM router) to activate live data.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
