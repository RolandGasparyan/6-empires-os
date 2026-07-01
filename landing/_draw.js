_drawManhattan(ts) {
    const ctx = this._mCtx, W = this._mW, H = this._mH;
    if (!ctx) return;
    const t = ts * 0.001;
    ctx.clearRect(0, 0, W, H);
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#020408'); sky.addColorStop(0.55, '#050912'); sky.addColorStop(0.85, '#0a0e1c'); sky.addColorStop(1, '#0d1220');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // Stars
    for (let i = 0; i < 90; i++) { const sx = (i * 139.7) % W, sy = (i * 71.3) % (H * 0.55), a = 0.2 + 0.25 * Math.sin(t * 0.4 + i); ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`; ctx.fillRect(sx, sy, 1, 1); }
    // Buildings
    const bs = this._mBuildings || [];
    bs.forEach(b => {
      const bY = H - b.h;
      const alpha = b.layer === 0 ? 0.92 : 0.97;
      const dark = b.layer === 0 ? '#090c14' : '#0c1020';
      ctx.fillStyle = dark; ctx.fillRect(b.x, bY, b.w, b.h);
      if (b.layer === 1) { ctx.strokeStyle = 'rgba(248,226,49,0.07)'; ctx.lineWidth = 1; ctx.strokeRect(b.x, bY, b.w, b.h); }
      // Windows
      b.windows.forEach(w => {
        if (Math.random() < w.rate) w.lit = !w.lit;
        if (!w.lit) return;
        const wx = b.x + b.padX + w.c * b.colW, wy = bY + b.padY + w.r * b.rowH;
        let c, gb;
        if (w.color === 'gold') { const a = (0.65 + 0.28 * Math.sin(t + w.c)).toFixed(2); c = `rgba(248,226,49,${a})`; gb = 8; }
        else if (w.color === 'amber') { const a = (0.55 + 0.25 * Math.sin(t * 0.85 + w.r)).toFixed(2); c = `rgba(255,175,55,${a})`; gb = 6; }
        else if (w.color === 'cyan') { const a = (0.45 + 0.2 * Math.sin(t + w.c + w.r)).toFixed(2); c = `rgba(0,210,255,${a})`; gb = 6; }
        else { const a = (0.5 + 0.2 * Math.sin(t * 1.1 + w.c)).toFixed(2); c = `rgba(240,240,210,${a})`; gb = 4; }
        ctx.shadowColor = c; ctx.shadowBlur = gb;
        ctx.fillStyle = c; ctx.fillRect(wx, wy, b.colW - 3, b.rowH - 3);
        ctx.shadowBlur = 0;
      });
    });
    // Ground glow
    const gg = ctx.createLinearGradient(0, H - 100, 0, H);
    gg.addColorStop(0, 'rgba(248,226,49,0)'); gg.addColorStop(1, 'rgba(248,226,49,0.1)');
    ctx.fillStyle = gg; ctx.fillRect(0, H - 100, W, 100);
  }