_buildManhattan(canvas) {
    const W = canvas.width, H = canvas.height;
    const buildings = [];
    const colors = ['gold','gold','gold','amber','amber','white','cyan'];
    const makeBuilding = (x, w, h, layer) => {
      const colW = layer === 0 ? 11 : 13, rowH = layer === 0 ? 15 : 17, padX = 4, padY = 4;
      const cols = Math.max(1, Math.floor((w - padX * 2) / colW));
      const rows = Math.max(1, Math.floor((h - padY * 2) / rowH));
      const windows = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.42) windows.push({ c, r, lit: Math.random() > 0.38, rate: 0.0005 + Math.random() * 0.002, color: colors[Math.floor(Math.random() * colors.length)] });
      }
      return { x, w, h, layer, windows, colW, rowH, padX, padY };
    };
    // Far layer
    let x = 0;
    while (x < W) { const w = 28 + Math.random() * 70, h = 50 + Math.random() * 180; buildings.push(makeBuilding(x, w, h, 0)); x += w + 2; }
    // Near layer
    x = -40;
    while (x < W + 40) { const w = 45 + Math.random() * 110, h = 100 + Math.random() * 340; buildings.push(makeBuilding(x, w, h, 1)); x += w + 3; }
    this._mBuildings = buildings;
    this._mCanvas = canvas;
    this._mCtx = canvas.getContext('2d');
    this._mW = W; this._mH = H;
  }