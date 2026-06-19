'use client';
/**
 * Procedural spatial-ish ambience for the Executive Command Center.
 * Generated entirely with the Web Audio API (no asset files): a low server hum,
 * a soft ambient gold pad, occasional notification blips, faint keyboard ticks.
 * Browsers block autoplay, so start() must be called from a user gesture
 * (the "Enter the Empire" button).
 */
export function createExecAudio() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let started = false;
  const timers: number[] = [];

  function start() {
    if (started) return;
    started = true;
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.2);

    // --- low server hum (two detuned sines + lowpass) ---
    const hum = ctx.createGain(); hum.gain.value = 0.06; hum.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; lp.connect(hum);
    [55, 58.2].forEach((f) => { const o = ctx!.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(lp); o.start(); });

    // --- ambient gold pad (slow triad with gentle LFO) ---
    const pad = ctx.createGain(); pad.gain.value = 0.0; pad.connect(master);
    pad.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 4);
    [220, 277.18, 329.63].forEach((f, i) => {
      const o = ctx!.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = ctx!.createGain(); g.gain.value = 0.33; o.connect(g); g.connect(pad);
      const lfo = ctx!.createOscillator(); lfo.frequency.value = 0.05 + i * 0.02;
      const lg = ctx!.createGain(); lg.gain.value = 0.15; lfo.connect(lg); lg.connect(g.gain); lfo.start();
      o.start();
    });

    // --- notification blips ---
    const blip = () => {
      if (!ctx || !master) return;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880 + Math.random() * 660;
      g.gain.value = 0; o.connect(g); g.connect(master);
      const t = ctx.currentTime;
      g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.start(t); o.stop(t + 0.26);
      timers.push(window.setTimeout(blip, 4000 + Math.random() * 6000));
    };
    timers.push(window.setTimeout(blip, 3000));

    // --- faint keyboard ticks (filtered noise bursts) ---
    const tick = () => {
      if (!ctx || !master) return;
      const buf = ctx.createBuffer(1, 256, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 2;
      const g = ctx.createGain(); g.gain.value = 0.02;
      src.connect(bp); bp.connect(g); g.connect(master); src.start();
      timers.push(window.setTimeout(tick, 180 + Math.random() * 500));
    };
    timers.push(window.setTimeout(tick, 1500));
  }

  function setVolume(v: number) { if (master && ctx) master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.3); }
  function stop() { timers.forEach(clearTimeout); try { ctx?.close(); } catch {} started = false; }

  return { start, setVolume, stop, get on() { return started; } };
}
