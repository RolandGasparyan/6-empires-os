'use client';
/**
 * 6 EMPIRES — Trading Command Center
 * Pixel-faithful rebuild of the master reference "6 EMPIRES AGENTNERY".
 * Black + gold luxury. Left nav · top stat bar · 3D office hero · control desk · right rail.
 */
import { useEffect, useState } from 'react';

const GOLD = '#d4af37';

const NAV = [
  ['◈', 'Dashboard', true], ['⬡', 'Agents', false], ['▦', 'Trading Floors', false],
  ['◆', 'Strategies', false], ['▣', 'Portfolio', false], ['◔', 'Markets', false],
  ['▤', 'Analytics', false], ['⛨', 'Risk Control', false], ['⚙', 'Automations', false],
  ['⚙', 'Settings', false], ['◈', 'Empire Vault', false],
] as const;

const AGENTS = [
  { name: 'Chief Strategist', perf: 82, color: '#cfd3da' },
  { name: 'Data Hunter',      perf: 76, color: '#2ecc71' },
  { name: 'Risk Guardian',    perf: 74, color: '#a855f7' },
  { name: 'Market Scout',     perf: 71, color: '#f4c430' },
  { name: 'Trend Tracker',    perf: 68, color: '#3b82f6' },
  { name: 'News Analyst',     perf: 69, color: '#ff5d8f' },
];

// office-floor agent pods (position + label), matching the reference layout
const PODS = [
  { name: 'MARKET SCOUT',    color: '#f4c430', x: 14, y: 60 },
  { name: 'TREND TRACKER',   color: '#3b82f6', x: 30, y: 38 },
  { name: 'CHIEF STRATEGIST', color: '#cfd3da', x: 50, y: 30 },
  { name: 'DATA HUNTER',     color: '#2ecc71', x: 50, y: 66 },
  { name: 'NEWS ANALYST',    color: '#ff5d8f', x: 70, y: 38 },
  { name: 'RISK GUARDIAN',   color: '#a855f7', x: 86, y: 60 },
];

const WATCH = [
  ['₿', 'BTC/USDT', '62,431.20', '+2.45%', true],
  ['Ξ', 'ETH/USDT', '3,421.35', '+3.21%', true],
  ['◇', 'GOLD', '2,345.80', '+1.02%', true],
  ['▲', 'NASDAQ', '18,738.53', '-1.29%', false],
  ['◆', 'SPX', '5,276.40', '+0.96%', true],
];
const TRADES = [
  ['₿', 'BTC/USDT', 'LONG', '+2.45%', true],
  ['Ξ', 'ETH/USDT', 'LONG', '+3.21%', true],
  ['◇', 'GOLD', 'LONG', '+1.02%', true],
  ['◎', 'SOL/USDT', 'LONG', '+2.15%', true],
];
const NEWS = [
  ['Fed Signals Possible Rate Cut', '10 min ago'],
  ['Crypto Market Hits New Highs', '25 min ago'],
  ['AI Stocks Surge on Earnings', '45 min ago'],
  ['Global Markets Rally', '1 hour ago'],
];

function Bot({ color, size = 38 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}>
      <ellipse cx="20" cy="37" rx="11" ry="2.4" fill="#000" opacity="0.5" />
      <circle cx="20" cy="17" r="12" fill={color} />
      <circle cx="20" cy="26" r="9" fill={color} opacity="0.9" />
      <circle cx="16" cy="15" r="2.4" fill="#0a0a0a" />
      <circle cx="24" cy="15" r="2.4" fill="#0a0a0a" />
      <circle cx="16.6" cy="14.4" r="0.8" fill="#fff" />
      <circle cx="24.6" cy="14.4" r="0.8" fill="#fff" />
      <rect x="13" y="6" width="1.4" height="4" rx="0.7" fill={color} /><circle cx="13.7" cy="5.6" r="1.4" fill={color} />
      <rect x="25.6" y="6" width="1.4" height="4" rx="0.7" fill={color} /><circle cx="26.3" cy="5.6" r="1.4" fill={color} />
    </svg>
  );
}

export default function EmpireDashboard() {
  const [now, setNow] = useState('');
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-auto" style={{ background: '#0a0a0b' }}>
      {/* ===== TOP BAR ===== */}
      <header className="flex items-center gap-6 px-5 h-16 border-b border-[#d4af37]/15"
        style={{ background: 'linear-gradient(180deg,#0e0e10,#0a0a0b)' }}>
        <div className="flex items-center gap-2.5">
          <img src="/empire-mark.svg" alt="6 Empires" width={34} height={34} />
          <div className="leading-none">
            <div className="font-serif tracking-[0.22em] text-[15px]" style={{ color: GOLD }}>6 EMPIRES</div>
            <div className="text-[8px] tracking-[0.34em] text-[#d4af37]/55 mt-1">AGENTNERY</div>
          </div>
        </div>
        <div className="flex items-center gap-7 ml-2">
          {[['LIVE AGENTS', '12', '#2ecc71'], ['ACTIVE TRADES', '34', GOLD], ['TOTAL PROFIT TODAY', '$12,450', '#2ecc71'], ['WIN RATE', '78.6%', '#2ecc71'], ['EMPIRE LEVEL', '6', GOLD]].map(([l, v, c]) => (
            <div key={l} className="text-center">
              <div className="text-[8px] tracking-[0.18em] text-white/40">{l}</div>
              <div className="font-mono text-[15px] font-semibold mt-0.5" style={{ color: c as string }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-white/40 text-sm">⌕</span>
          <span className="relative text-white/40 text-sm">⊙<span className="absolute -top-1.5 -right-1.5 bg-[#ff5d8f] text-[8px] rounded-full w-3.5 h-3.5 grid place-items-center text-white">3</span></span>
          <span className="text-white/40 text-sm">✉</span>
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="w-8 h-8 rounded-full grid place-items-center" style={{ background: 'linear-gradient(135deg,#1a1a1d,#0a0a0b)', border: `1px solid ${GOLD}55` }}><Bot color="#cfd3da" size={20} /></div>
            <div className="leading-none"><div className="text-[12px] text-white/90 font-medium">EMPIRE BOSS</div><div className="text-[9px] text-[#d4af37]/60">Admin</div></div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ===== LEFT NAV ===== */}
        <aside className="w-[210px] shrink-0 min-h-[calc(100vh-4rem)] border-r border-[#d4af37]/12 px-3 py-4" style={{ background: '#0c0c0e' }}>
          <nav className="space-y-1">
            {NAV.map(([icon, label, active]) => (
              <div key={label as string}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] ${active ? 'text-[#0a0a0b]' : 'text-white/55 hover:text-white/85 hover:bg-white/[0.03]'}`}
                style={active ? { background: 'linear-gradient(135deg,#e3c668,#c8941a)', fontWeight: 600 } : {}}>
                <span style={{ color: active ? '#0a0a0b' : GOLD }}>{icon}</span>{label}
                {label === 'Agents' && <span className="ml-auto text-[10px] text-[#d4af37]/70">12</span>}
              </div>
            ))}
          </nav>
          <div className="mt-8 px-3">
            <div className="text-[9px] tracking-[0.2em] text-[#d4af37]/50 mb-2">EMPIRE MOTTO</div>
            <div className="font-serif text-[15px] leading-tight">
              <div className="text-white/90">WE BUILD.</div>
              <div style={{ color: GOLD }}>WE TRADE.</div>
              <div className="text-white/90">WE OWN.</div>
            </div>
            <div className="mt-5 grid place-items-center">
              <div className="w-16 h-20" style={{ background: `radial-gradient(ellipse at center, ${GOLD}, #7d590b 70%, transparent)`, clipPath: 'polygon(50% 0,100% 38%,50% 100%,0 38%)', filter: `drop-shadow(0 0 16px ${GOLD}88)` }} />
            </div>
          </div>
        </aside>

        {/* ===== CENTER ===== */}
        <main className="flex-1 min-w-0 p-4">
          {/* --- 3D OFFICE HERO --- */}
          <div className="relative rounded-2xl overflow-hidden border border-[#d4af37]/20"
            style={{ height: 360, background: 'radial-gradient(ellipse at 50% 18%, #16140e 0%, #0c0c0e 55%, #060606 100%)' }}>
            {/* city windows */}
            <div className="absolute inset-x-0 top-0 h-28 opacity-40" style={{ background: 'linear-gradient(180deg, rgba(40,55,80,0.5), transparent)' }} />
            <div className="absolute left-6 top-4 w-40 h-20 rounded opacity-30" style={{ background: 'repeating-linear-gradient(90deg,#1a2a44 0 2px,transparent 2px 6px), repeating-linear-gradient(0deg,#1a2a44 0 2px,transparent 2px 8px)' }} />
            <div className="absolute right-6 top-4 w-40 h-20 rounded opacity-30" style={{ background: 'repeating-linear-gradient(90deg,#1a2a44 0 2px,transparent 2px 6px), repeating-linear-gradient(0deg,#1a2a44 0 2px,transparent 2px 8px)' }} />
            {/* back-wall emblem + wordmark */}
            <div className="absolute left-1/2 top-7 -translate-x-1/2 flex flex-col items-center">
              <img src="/empire-mark.svg" width={54} height={54} alt="" style={{ filter: `drop-shadow(0 0 18px ${GOLD}aa)` }} />
              <div className="font-serif tracking-[0.32em] text-[20px] mt-1" style={{ color: GOLD }}>6 EMPIRES</div>
              <div className="text-[8px] tracking-[0.4em] text-[#d4af37]/60 mt-1">AGENTNERY</div>
              <div className="text-[8px] tracking-[0.25em] text-white/35 mt-1">WE BUILD. WE TRADE. WE OWN.</div>
            </div>
            {/* marble floor */}
            <div className="absolute inset-x-0 bottom-0 h-44" style={{ background: 'linear-gradient(180deg, transparent, #0a0c0a 40%, #060706)', boxShadow: `inset 0 1px 0 ${GOLD}22` }} />
            {/* agent pods */}
            {PODS.map((p) => (
              <div key={p.name} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <Bot color={p.color} size={p.name === 'CHIEF STRATEGIST' || p.name === 'DATA HUNTER' ? 46 : 36} />
                <div className="mt-1 px-2 py-0.5 rounded text-[7px] tracking-[0.12em] font-semibold"
                  style={{ color: GOLD, background: '#000a', border: `1px solid ${GOLD}55` }}>{p.name}</div>
                {/* pod platform glow */}
                <div className="absolute -bottom-1 w-16 h-3 rounded-full -z-10" style={{ background: `radial-gradient(ellipse, ${p.color}33, transparent 70%)` }} />
              </div>
            ))}
            <div className="absolute bottom-2 right-3 text-[8px] text-white/25 tracking-wider">RENDERED VIEW · drop final render in /public to replace</div>
          </div>

          {/* --- CONTROL DESK ROW --- */}
          <div className="grid grid-cols-12 gap-3 mt-3">
            <Panel title="WATCHLIST" className="col-span-3">
              {WATCH.map(([ic, sym, px, chg, up]) => (
                <Row key={sym as string} a={<span className="text-[#d4af37]">{ic}</span>} b={sym as string} c={px as string} d={chg as string} up={up as boolean} />
              ))}
            </Panel>
            <Panel title="ACTIVE TRADES" className="col-span-2">
              {TRADES.map(([ic, sym, side, chg, up]) => (
                <div key={sym as string} className="flex items-center justify-between py-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="text-[#d4af37]">{ic}</span><span className="text-white/80">{sym}</span></span>
                  <span className="text-[#2ecc71]">{chg}</span>
                </div>
              ))}
            </Panel>
            <Panel title="MARKET OVERVIEW" className="col-span-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[13px]" style={{ color: GOLD }}>62,431.20 <span className="text-[#2ecc71] text-[11px]">+2.45%</span></span>
                <span className="text-[9px] text-white/30">1D 1W 1M 3M ALL</span>
              </div>
              <Spark />
            </Panel>
            <Panel title="PROFIT ANALYTICS" className="col-span-2">
              <div className="text-[10px] text-white/40">Total Profit</div>
              <div className="font-mono text-[18px] text-[#2ecc71]">$12,450 <span className="text-[10px]">+8.24%</span></div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full" style={{ background: `conic-gradient(#2ecc71 0 78%, #ff5d8f 78% 100%)` }} />
                <div className="text-[9px] leading-tight text-white/50"><div>Wins 267</div><div>Losses 72</div><div>Total 339</div></div>
              </div>
            </Panel>
            <Panel title="NEWS FEED" className="col-span-1 !min-w-[150px]" wide>
              {NEWS.map(([t, ago]) => (
                <div key={t} className="py-1"><div className="text-[10px] text-white/80 leading-tight">{t}</div><div className="text-[8px] text-white/35">{ago}</div></div>
              ))}
            </Panel>
          </div>

          {/* --- COMMAND ROW --- */}
          <div className="grid grid-cols-12 gap-3 mt-3">
            <Panel title="AI COMMAND CENTER" className="col-span-3">
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {['Scan Markets', 'Execute Strategy', 'Analyze Sentiment', 'Risk Check'].map((b) => (
                  <button key={b} className="text-[9px] py-2 rounded-lg text-[#d4af37]" style={{ background: '#000a', border: `1px solid ${GOLD}3a` }}>{b}</button>
                ))}
              </div>
            </Panel>
            <div className="col-span-6 flex items-center justify-center gap-3">
              {['EXECUTE ALL', 'PAUSE ALL', 'REBALANCE'].map((b, i) => (
                <button key={b} className="px-6 py-3 rounded-xl text-[12px] font-semibold tracking-wide"
                  style={i === 0 ? { background: 'linear-gradient(135deg,#e3c668,#c8941a)', color: '#0a0a0b' } : { background: '#0e0e10', color: GOLD, border: `1px solid ${GOLD}3a` }}>{b}</button>
              ))}
            </div>
            <Panel title="RISK LEVEL" className="col-span-3">
              <div className="flex items-center gap-3 mt-1">
                <div className="w-12 h-12 rounded-full grid place-items-center" style={{ background: `conic-gradient(${GOLD} 0 50%, #1a1a1d 50% 100%)` }}>
                  <div className="w-9 h-9 rounded-full bg-[#0a0a0b] grid place-items-center text-[9px] text-[#2ecc71]">MED</div>
                </div>
                <div className="text-[10px] text-white/50">Medium exposure<br/>across 34 positions</div>
              </div>
            </Panel>
          </div>
        </main>

        {/* ===== RIGHT RAIL ===== */}
        <aside className="w-[270px] shrink-0 border-l border-[#d4af37]/12 p-4 space-y-4" style={{ background: '#0c0c0e' }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-[0.18em] text-white/45">PROJECT INFO</span>
            <span className="text-[9px] px-2 py-0.5 rounded text-[#2ecc71]" style={{ border: '1px solid #2ecc7155' }}>WORKING</span>
          </div>
          <div>
            <div className="font-serif text-[15px]" style={{ color: GOLD }}>6 Empires Agent Workspace</div>
            <p className="text-[11px] text-white/45 mt-1 leading-relaxed">A clean and powerful workspace where real trading agents analyze markets, execute strategies, and grow the empire.</p>
            <button className="w-full mt-3 py-2.5 rounded-lg text-[12px] text-[#d4af37]" style={{ border: `1px solid ${GOLD}3a` }}>+ NEW PROJECT</button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><span className="text-[10px] tracking-[0.18em] text-[#d4af37]/60">AGENT PERFORMANCE</span><span className="text-[9px] text-white/30">VIEW ALL</span></div>
            <div className="space-y-2.5">
              {AGENTS.map((a) => (
                <div key={a.name} className="flex items-center gap-2">
                  <Bot color={a.color} size={20} />
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px]"><span className="text-white/75">{a.name}</span><span className="text-white/55">{a.perf}%</span></div>
                    <div className="h-1 rounded-full bg-white/10 mt-1 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${a.perf}%`, background: a.color }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-white/8">
            <div className="text-[10px] tracking-[0.18em] text-[#d4af37]/60">EMPIRE BALANCE</div>
            <div className="text-[10px] text-white/40 mt-1">TOTAL VALUE</div>
            <div className="font-mono text-[22px] text-[#2ecc71]">$256,780.45</div>
            <div className="text-[11px] text-[#2ecc71]">+ 8.24% (24h)</div>
            <Spark mini />
            <button className="w-full mt-3 py-2.5 rounded-lg text-[12px] font-semibold" style={{ background: 'linear-gradient(135deg,#e3c668,#c8941a)', color: '#0a0a0b' }}>VIEW PORTFOLIO</button>
          </div>
        </aside>
      </div>

      <footer className="h-9 flex items-center justify-center gap-3 text-[10px] tracking-[0.2em] border-t border-[#d4af37]/12" style={{ color: `${GOLD}99` }}>
        <span>6 EMPIRES AGENTNERY</span><span className="text-white/20">•</span><span>WE BUILD. WE TRADE. WE OWN.</span><span className="text-white/20">•</span><span className="text-white/40">{now} UTC+0</span>
      </footer>
    </div>
  );
}

function Panel({ title, children, className = '', wide }: { title: string; children: React.ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${className}`} style={{ background: 'linear-gradient(180deg,#101012,#0b0b0d)', border: '1px solid #d4af3722' }}>
      <div className="text-[9px] tracking-[0.18em] text-[#d4af37]/60 mb-2">{title}</div>
      {children}
    </div>
  );
}
function Row({ a, b, c, d, up }: { a: React.ReactNode; b: string; c: string; d: string; up: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11px]">
      <span className="flex items-center gap-1.5">{a}<span className="text-white/70 font-mono">{b}</span></span>
      <span className="text-white/80 font-mono tabular-nums">{c}</span>
      <span className={`font-mono tabular-nums ${up ? 'text-[#2ecc71]' : 'text-[#ff5d8f]'}`}>{d}</span>
    </div>
  );
}
function Spark({ mini }: { mini?: boolean }) {
  const pts = '0,28 12,22 24,25 36,14 48,18 60,9 72,13 84,5 96,8 100,3';
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={`w-full ${mini ? 'h-10' : 'h-16'}`}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2ecc71" stopOpacity="0.4" /><stop offset="1" stopColor="#2ecc71" stopOpacity="0" /></linearGradient></defs>
      <polyline points={`${pts} 100,30 0,30`} fill="url(#sg)" stroke="none" />
      <polyline points={pts} fill="none" stroke="#2ecc71" strokeWidth="1.2" />
    </svg>
  );
}
