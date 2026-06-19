'use client';
/** Shared page chrome for any department room: enter-gate, audio, inspect panel. */
import { useEffect, useRef, useState, ComponentType } from 'react';
import { createExecAudio } from './useExecAudio';
import type { DeptConfig } from './roomKit';

const GOLD = '#d4af37';

export function DeptPage({ cfg, Scene }: { cfg: DeptConfig; Scene: ComponentType<{ onPick?: (id: string) => void }> }) {
  const [entered, setEntered] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const audio = useRef(createExecAudio());
  useEffect(() => () => audio.current.stop(), []);
  function enter() { audio.current.start(); setEntered(true); }
  const info = pick ? cfg.inspect[pick] : null;

  return (
    <div className="absolute inset-0" style={{ background: '#050507' }}>
      <div className="absolute inset-0"><Scene onPick={(id: string) => setPick(id)} /></div>

      <div className="absolute top-4 left-5 flex items-center gap-3 pointer-events-none">
        <img src="/empire-mark.svg" width={38} height={38} alt="6 Empires" />
        <div className="leading-none">
          <div className="font-serif tracking-[0.24em] text-[17px]" style={{ color: GOLD }}>{cfg.title}</div>
          <div className="text-[9px] tracking-[0.3em] mt-1" style={{ color: `${cfg.primary}cc` }}>{cfg.subtitle}</div>
        </div>
      </div>
      <div className="absolute top-5 right-5 font-mono text-[10px] text-white/40 pointer-events-none text-right">
        click the desk · screens · agent · board · hologram<br />drag to orbit · scroll to zoom
      </div>

      {entered && (
        <button onClick={() => audio.current.setVolume(audio.current.on ? 0 : 0.5)}
          className="absolute bottom-5 left-5 px-3 py-2 rounded-lg text-[11px] backdrop-blur"
          style={{ background: '#0c0c0ecc', border: `1px solid ${GOLD}44`, color: GOLD }}>♪ ambience</button>
      )}

      {info && (
        <div className="absolute right-5 bottom-5 w-[300px] rounded-2xl p-4 backdrop-blur"
          style={{ background: '#0b0b0ddd', border: `1px solid ${info.accent}66`, boxShadow: `0 0 50px -12px ${info.accent}66` }}>
          <div className="flex items-center justify-between">
            <div className="font-serif tracking-[0.14em] text-[16px]" style={{ color: info.accent }}>{info.title}</div>
            <button onClick={() => setPick(null)} className="text-white/40">✕</button>
          </div>
          <p className="text-[11px] text-white/55 mt-1.5 leading-relaxed">{info.body}</p>
          <div className="mt-3 space-y-1.5">
            {info.lines.map(([k, v]) => <div key={k} className="flex justify-between text-[11px]"><span className="text-white/40">{k}</span><span style={{ color: info.accent }} className="font-mono">{v}</span></div>)}
          </div>
        </div>
      )}

      {!entered && (
        <div className="absolute inset-0 grid place-items-center backdrop-blur-sm" style={{ background: '#050507e6' }}>
          <div className="text-center">
            <img src="/empire-logo.svg" width={150} height={175} alt="6 Empire" className="mx-auto" />
            <div className="mt-2 font-serif tracking-[0.22em] text-[13px]" style={{ color: cfg.primary }}>{cfg.title}</div>
            <button onClick={enter} className="mt-5 px-10 py-4 rounded-xl font-serif tracking-[0.2em] text-[15px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#f4d98b,#c8941a)', color: '#0a0a0b', boxShadow: `0 0 50px -8px ${GOLD}` }}>
              ENTER
            </button>
            <div className="mt-3 text-[10px] tracking-[0.25em] text-white/35">SPATIAL AUDIO · LIVE 3D · INTERACTIVE</div>
          </div>
        </div>
      )}
    </div>
  );
}
