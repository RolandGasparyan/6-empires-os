'use client';
/**
 * /executive — the showcase Executive Command Center.
 * Click-to-enter gate (unmutes spatial audio), the live 3D room, and a
 * contextual inspect panel that opens when you click objects in the room.
 */
import { useEffect, useRef, useState } from 'react';
import { clientScene } from '@/components/three/SceneLoader';
import { createExecAudio } from '@/components/executive/useExecAudio';

const Scene = clientScene(() => import('@/components/executive/ExecutiveScene'));
const GOLD = '#d4af37';

const INSPECT: Record<string, { title: string; accent: string; body: string; lines: [string, string][] }> = {
  boss: { title: 'EMPIRE BOSS', accent: '#e8e6df', body: 'Strategic authority of the corporation. Commands all departments and agents.', lines: [['Status', 'COMMANDING'], ['Decisions today', '47'], ['Agents directed', '12']] },
  desk: { title: 'EXECUTIVE DESK', accent: GOLD, body: 'Black-marble command desk with live triple-screen analytics.', lines: [['Material', 'Obsidian marble + gold'], ['Screens', '3 live feeds']] },
  screens: { title: 'EXECUTIVE ANALYTICS', accent: '#34f5a0', body: 'Real-time empire performance: P&L curve, agent throughput, global map.', lines: [['P&L (24h)', '+$12,450'], ['Win rate', '78.6%'], ['Throughput', '846 tasks/h']] },
  hologram: { title: 'GLOBAL OPERATIONS', accent: '#3b82f6', body: 'Live world hologram — empire reach across markets and regions.', lines: [['Active regions', '14'], ['Markets', 'Crypto · FX · Equities']] },
  board: { title: 'PROJECT BOARD', accent: '#3b82f6', body: 'Physical kanban of the empire’s active initiatives.', lines: [['Scheduled', '3'], ['Active', '3'], ['Done', '3']] },
  logo: { title: '6 EMPIRES', accent: GOLD, body: 'The empire mark. One vision, six minds, endless empire.', lines: [['Motto', 'WE BUILD · WE TRADE · WE OWN'], ['Empire level', '6']] },
  hologram2: { title: 'HOLOGRAM', accent: '#3b82f6', body: '', lines: [] },
  coffee: { title: 'BARISTA STATION', accent: '#3b82f6', body: 'Even an empire runs on espresso. Self-serve, always hot.', lines: [['Status', 'Brewing'], ['Cups today', '23']] },
};

export default function ExecutivePage() {
  const [entered, setEntered] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const audio = useRef(createExecAudio());

  useEffect(() => () => audio.current.stop(), []);

  function enter() { audio.current.start(); setEntered(true); }
  const info = pick ? INSPECT[pick] : null;

  return (
    <div className="absolute inset-0" style={{ background: '#050507' }}>
      <div className="absolute inset-0"><Scene onPick={(id: string) => setPick(id)} /></div>

      {/* brand */}
      <div className="absolute top-4 left-5 flex items-center gap-3 pointer-events-none">
        <img src="/empire-mark.svg" width={38} height={38} alt="6 Empires" />
        <div className="leading-none">
          <div className="font-serif tracking-[0.24em] text-[17px]" style={{ color: GOLD }}>6 EMPIRES</div>
          <div className="text-[9px] tracking-[0.3em] text-[#d4af37]/55 mt-1">EXECUTIVE COMMAND CENTER</div>
        </div>
      </div>
      <div className="absolute top-5 right-5 font-mono text-[10px] text-white/40 pointer-events-none text-right">
        click the desk · screens · boss · board · hologram<br />drag to orbit · scroll to zoom
      </div>

      {/* audio toggle */}
      {entered && (
        <button onClick={() => audio.current.setVolume(audio.current.on ? 0 : 0.5)}
          className="absolute bottom-5 left-5 px-3 py-2 rounded-lg text-[11px] text-[#d4af37] backdrop-blur"
          style={{ background: '#0c0c0ecc', border: `1px solid ${GOLD}44` }}>♪ ambience</button>
      )}

      {/* inspect panel */}
      {info && (
        <div className="absolute right-5 bottom-5 w-[300px] rounded-2xl p-4 backdrop-blur"
          style={{ background: '#0b0b0ddd', border: `1px solid ${info.accent}66`, boxShadow: `0 0 50px -12px ${info.accent}66` }}>
          <div className="flex items-center justify-between">
            <div className="font-serif tracking-[0.14em] text-[16px]" style={{ color: info.accent }}>{info.title}</div>
            <button onClick={() => setPick(null)} className="text-white/40">✕</button>
          </div>
          <p className="text-[11px] text-white/55 mt-1.5 leading-relaxed">{info.body}</p>
          <div className="mt-3 space-y-1.5">
            {info.lines.map(([k, v]) => (
              <div key={k} className="flex justify-between text-[11px]"><span className="text-white/40">{k}</span><span style={{ color: info.accent }} className="font-mono">{v}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* click-to-enter gate */}
      {!entered && (
        <div className="absolute inset-0 grid place-items-center backdrop-blur-sm" style={{ background: '#050507e6' }}>
          <div className="text-center">
            <img src="/empire-logo.svg" width={150} height={175} alt="6 Empire" className="mx-auto" />
            <button onClick={enter}
              className="mt-6 px-10 py-4 rounded-xl font-serif tracking-[0.2em] text-[15px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#f4d98b,#c8941a)', color: '#0a0a0b', boxShadow: `0 0 50px -8px ${GOLD}` }}>
              ENTER THE EMPIRE
            </button>
            <div className="mt-3 text-[10px] tracking-[0.25em] text-white/35">SPATIAL AUDIO · LIVE 3D · INTERACTIVE</div>
          </div>
        </div>
      )}
    </div>
  );
}
