'use client';
import { useConsole } from '@/data/useConsole';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { MetricTile } from '@/components/ui/MetricTile';
import { GlassCard } from '@/components/ui/GlassCard';

const STAT_COLOR: Record<string, string> = {
  ANALYZING: '#3fe0ff', RESEARCHING: '#34f5a0', MONITORING: '#ff5d8f',
  TRADING: '#e3ad28', WRITING: '#a78bfa', THINKING: '#f0997b', IDLE: '#888780',
};

function Spark({ series, color = '#34f5a0' }: { series: number[]; color?: string }) {
  const max = Math.max(...series), min = Math.min(...series);
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 28}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-12">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}

export default function ConsolePage() {
  const { data, source, live } = useConsole();
  const p = data.tasks.pipeline;

  return (
    <div className="absolute inset-0 bg-obsidian-radial overflow-auto scanlines p-6 md:p-8">
      <div className="flex items-start justify-between">
        <ModuleHeader eyebrow="Executive Console" title="Working Console" status={`${data.agents.online} agents online · ${source === 'mock' ? 'SIM' : live ? 'LIVE' : 'CONNECTING'}`} />
        <div className="font-mono text-[11px] text-white/40 text-right">
          <div>SYSTEM HEALTH <span className="text-empire-success">{data.system.health}%</span></div>
          <div className="mt-0.5">UPTIME <span className="text-empire-gold">{data.deployments.uptime_pct}%</span></div>
        </div>
      </div>

      {/* top metric row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
        <MetricTile label="Revenue (24h)" value={`$${(data.revenue.total_value / 1000).toFixed(1)}K`} accent="success" delta={data.revenue.change_24h} />
        <MetricTile label="P&L Today" value={`$${data.trading.pnl_today.toLocaleString()}`} accent="gold" />
        <MetricTile label="Win Rate" value={data.trading.win_rate} unit="%" accent="cyan" />
        <MetricTile label="Active Trades" value={data.trading.active_trades} accent="gold" />
        <MetricTile label="Agents" value={`${data.agents.online}/${data.agents.total}`} accent="success" />
        <MetricTile label="Projects" value={data.projects.total} accent="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* agent performance */}
        <GlassCard className="p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-gold-500/60 mb-3">AGENT PERFORMANCE</div>
          <div className="space-y-2.5">
            {data.agents.performance.map((a) => (
              <div key={a.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80">{a.name}</span>
                  <span style={{ color: STAT_COLOR[a.status] }} className="font-mono text-[10px]">{a.status} · {a.perf}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full" style={{ width: `${a.perf}%`, background: STAT_COLOR[a.status] }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* revenue + task pipeline */}
        <GlassCard className="p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-gold-500/60 mb-2">EMPIRE REVENUE</div>
          <div className="text-2xl font-display font-bold text-empire-success">${data.revenue.total_value.toLocaleString()}</div>
          <div className="text-[11px] text-empire-success">▲ {data.revenue.change_24h}% (24h)</div>
          <Spark series={data.revenue.series} />
          <div className="font-mono text-[10px] tracking-[0.2em] text-gold-500/60 mt-3 mb-2">TASK PIPELINE</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['queued', '#888780'], ['active', '#3fe0ff'], ['done', '#34f5a0'], ['failed', '#ff5d8f']].map(([k, c]) => (
              <div key={k} className="glass rounded-lg py-2">
                <div className="text-lg font-display font-bold" style={{ color: c as string }}>{p[k] ?? 0}</div>
                <div className="text-[9px] uppercase tracking-wider text-white/40">{k}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* trading watchlist + system */}
        <GlassCard className="p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-gold-500/60 mb-2">LIVE MARKET</div>
          <div className="space-y-1.5">
            {data.trading.watchlist.map((w) => (
              <div key={w.sym} className="flex justify-between items-center text-xs">
                <span className="text-white/70 font-mono">{w.sym}</span>
                <span className="text-white/85 tabular-nums">{w.px.toLocaleString()}</span>
                <span className={`tabular-nums ${w.chg >= 0 ? 'text-empire-success' : 'text-empire-danger'}`}>{w.chg >= 0 ? '+' : ''}{w.chg}%</span>
              </div>
            ))}
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-gold-500/60 mt-4 mb-2">INFRASTRUCTURE</div>
          <div className="grid grid-cols-2 gap-2">
            {[['CPU', data.system.cpu, '%'], ['RAM', data.system.ram, '%'], ['Disk', data.system.disk, '%'], ['Gateway', data.system.gateway_ms, 'ms']].map(([l, v, u]) => (
              <div key={l as string} className="flex justify-between text-[11px]"><span className="text-white/45">{l}</span><span className="text-empire-gold tabular-nums">{v}{u}</span></div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* projects + deployments row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <GlassCard className="p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-gold-500/60 mb-3">ACTIVE PROJECTS</div>
          <div className="space-y-3">
            {data.projects.active.map((pr) => (
              <div key={pr.name}>
                <div className="flex justify-between text-xs mb-1"><span className="text-white/80">{pr.name}</span><span className="text-empire-gold font-mono">{pr.progress}%</span></div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden"><div className="h-full bg-gold-liquid animate-gold-flow" style={{ width: `${pr.progress}%` }} /></div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-gold-500/60 mb-3">DEPLOYMENTS & RESEARCH</div>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Services Healthy" value={`${data.deployments.healthy}/${data.deployments.services}`} accent="success" />
            <MetricTile label="Knowledge Nodes" value={data.research.entities} accent="gold" />
            <MetricTile label="Reports Today" value={data.research.reports_today} accent="cyan" />
            <MetricTile label="Relationships" value={data.research.relationships} accent="gold" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
