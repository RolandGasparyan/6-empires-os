'use client';
/**
 * /command — STEP 2 MVP: Central HQ Command Room with named agents.
 * Click any agent → premium profile card (name · title · tagline · status),
 * styled after the "OUR EMPIRE TEAM" card. Enter-gate + spatial audio.
 */
import { useEffect, useRef, useState } from 'react';
import { clientScene } from '@/components/three/SceneLoader';
import { createExecAudio } from '@/components/executive/useExecAudio';
import type { TeamMember } from '@/components/executive/team';

const Scene = clientScene(() => import('@/components/executive/CommandRoomScene'));
const GOLD = '#d4af37';

export default function CommandPage() {
  const [entered, setEntered] = useState(false);
  const [sel, setSel] = useState<TeamMember | null>(null);
  const audio = useRef(createExecAudio());
  useEffect(() => () => audio.current.stop(), []);
  function enter() { audio.current.start(); setEntered(true); }

  return (
    <div className="absolute inset-0" style={{ background: '#050507' }}>
      <div className="absolute inset-0"><Scene onPick={(m: TeamMember) => setSel(m)} /></div>

      {/* brand */}
      <div className="absolute top-4 left-5 flex items-center gap-3 pointer-events-none">
        <img src="/empire-mark.svg" width={40} height={40} alt="6 Empires" />
        <div className="leading-none">
          <div className="font-serif tracking-[0.24em] text-[17px]" style={{ color: GOLD }}>6 EMPIRES</div>
          <div className="text-[9px] tracking-[0.3em] text-[#d4af37]/55 mt-1">CENTRAL COMMAND</div>
        </div>
      </div>
      <div className="absolute top-5 right-5 font-mono text-[10px] text-white/40 pointer-events-none text-right">
        click an agent to open their profile<br />drag to orbit · scroll to zoom
      </div>

      {entered && (
        <button onClick={() => audio.current.setVolume(audio.current.on ? 0 : 0.5)}
          className="absolute bottom-5 left-5 px-3 py-2 rounded-lg text-[11px] backdrop-blur"
          style={{ background: '#0c0c0ecc', border: `1px solid ${GOLD}44`, color: GOLD }}>♪ ambience</button>
      )}

      {/* AGENT PROFILE CARD (team-card style) */}
      {sel && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-[280px] rounded-2xl overflow-hidden backdrop-blur"
          style={{ background: '#0a0a0cee', border: `1px solid ${sel.color}88`, boxShadow: `0 0 60px -14px ${sel.color}` }}>
          {/* color header band */}
          <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${sel.color}, #0a0a0c)` }}>
            <button onClick={() => setSel(null)} className="absolute top-2 right-3 text-white/70">✕</button>
            <div className="absolute -bottom-7 left-5 w-14 h-14 rounded-full grid place-items-center"
              style={{ background: '#0a0a0c', border: `2px solid ${sel.color}` }}>
              <div className="w-9 h-9 rounded-full" style={{ background: sel.color, boxShadow: `0 0 14px ${sel.color}` }} />
            </div>
            <div className="absolute top-3 left-5 text-[9px] tracking-[0.3em]" style={{ color: '#000a' }}>👑 6 EMPIRES</div>
          </div>
          <div className="px-5 pt-9 pb-5">
            <div className="font-serif text-[18px] text-white leading-tight">{sel.name}</div>
            <div className="font-mono text-[11px] tracking-[0.15em] mt-0.5" style={{ color: sel.color }}>{sel.title}</div>
            <div className="mt-3 text-[12px] text-white/70 italic">{sel.tagline}</div>
            <div className="text-[12px] text-white/45 mt-0.5">{sel.blurb}</div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.2em] text-white/40">STATUS</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: sel.color }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: sel.color }} />{sel.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* enter gate */}
      {!entered && (
        <div className="absolute inset-0 grid place-items-center backdrop-blur-sm" style={{ background: '#050507e6' }}>
          <div className="text-center">
            <img src="/empire-logo.svg" width={150} height={175} alt="6 Empire" className="mx-auto" />
            <div className="mt-1 font-serif tracking-[0.28em] text-[12px] text-white/60">OUR EMPIRE TEAM</div>
            <button onClick={enter} className="mt-5 px-10 py-4 rounded-xl font-serif tracking-[0.2em] text-[15px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#f4d98b,#c8941a)', color: '#0a0a0b', boxShadow: `0 0 50px -8px ${GOLD}` }}>
              ENTER COMMAND
            </button>
            <div className="mt-3 text-[10px] tracking-[0.25em] text-white/35">LIVE 3D · NAMED AGENTS · INTERACTIVE</div>
          </div>
        </div>
      )}
    </div>
  );
}
