'use client';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/data/useChat';

const AGENT_COLOR: Record<string, string> = {
  strat: '#3fe0ff', data: '#34f5a0', risk: '#ff5d8f',
  scout: '#e3ad28', news: '#a78bfa', trend: '#f0997b',
};
const AGENT_NAME: Record<string, string> = {
  strat: 'Chief Strategist', data: 'Data Hunter', risk: 'Risk Guardian',
  scout: 'Market Scout', news: 'News Analyst', trend: 'Trend Tracker',
};

export default function ChatPage() {
  const [channel, setChannel] = useState('command');
  const { channels, messages, send, source } = useChat(channel);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function submit() {
    if (!input.trim()) return;
    setSending(true);
    try { await send(input); setInput(''); } catch { /* ignore */ } finally { setSending(false); }
  }

  return (
    <div className="absolute inset-0 bg-obsidian-radial flex">
      {/* channel rail */}
      <aside className="w-60 shrink-0 glass border-r border-gold-500/15 flex flex-col p-3">
        <div className="flex items-center gap-2 px-1 mb-4">
          <div className="h-8 w-8 rounded-lg bg-gold-liquid animate-gold-flow grid place-items-center font-display font-extrabold text-obsidian-950 text-sm">6</div>
          <div>
            <div className="font-display font-bold text-sm text-gold-liquid leading-none">COMMAND CHAT</div>
            <div className="text-[9px] tracking-[0.2em] text-white/35 mt-0.5">{source === 'mock' ? 'SIM' : 'LIVE'}</div>
          </div>
        </div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-gold-500/60 px-1 mb-2">CHANNELS</div>
        {channels.map((c) => (
          <button key={c.key} onClick={() => setChannel(c.key)}
            className={`text-left rounded-xl px-3 py-2.5 mb-1 transition-colors ${channel === c.key ? 'bg-gold-500/12 text-empire-gold' : 'text-white/55 hover:text-white hover:bg-white/5'}`}>
            <div className="text-sm font-medium">{c.name}</div>
            <div className="text-[10px] text-white/35">{c.desc}</div>
          </button>
        ))}
        <div className="mt-auto pt-3 border-t border-white/5 px-1">
          <div className="text-[10px] text-white/30 font-mono">FOUNDER · EMPIRE BOSS</div>
          <div className="text-[9px] text-white/25 mt-1">@strat · @data · @risk · @all</div>
        </div>
      </aside>

      {/* thread */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 glass border-b border-gold-500/15 flex items-center px-6">
          <div>
            <div className="font-display font-semibold text-white">{channels.find((c) => c.key === channel)?.name ?? channel}</div>
            <div className="text-[11px] text-white/40">{channels.find((c) => c.key === channel)?.desc}</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-white/30 text-sm mt-10">No messages yet. Command an agent — try <span className="text-empire-gold">@strat analyze Q3</span> or <span className="text-empire-gold">@all report status</span>.</div>
          )}
          {messages.map((m) => {
            const isFounder = m.sender === 'founder';
            const col = m.agent_key ? AGENT_COLOR[m.agent_key] ?? '#e6c878' : '#e6c878';
            return (
              <div key={m.id} className={`flex ${isFounder ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${isFounder ? 'bg-gold-500/12 border border-gold-500/25' : 'glass'}`}>
                  {!isFounder && (
                    <div className="text-[11px] font-semibold mb-0.5" style={{ color: col }}>
                      {m.agent_key ? (AGENT_NAME[m.agent_key] ?? m.agent_key) : 'System'}
                    </div>
                  )}
                  <div className={`text-sm leading-relaxed ${isFounder ? 'text-empire-gold' : 'text-white/85'}`}>{m.body}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="shrink-0 p-4 border-t border-gold-500/15">
          <div className="glass glass-gold rounded-2xl flex items-center gap-2 px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Message the empire…  @strat  @all"
              className="flex-1 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/25"
            />
            <button onClick={submit} disabled={sending || !input.trim()}
              className="bg-gold-liquid animate-gold-flow text-obsidian-950 font-semibold text-sm px-4 py-1.5 rounded-xl shadow-gold-glow disabled:opacity-40">
              {sending ? '…' : 'Send'}
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {['@all report status', '@strat analyze Q3', '@risk status check', '@scout scan markets'].map((q) => (
              <button key={q} onClick={() => setInput(q)} className="font-mono text-[10px] text-empire-gold/70 border border-gold-500/25 rounded-lg px-2.5 py-1 hover:bg-gold-500/10">{q}</button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
