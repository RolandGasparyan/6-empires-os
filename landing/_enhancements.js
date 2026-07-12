
var SIX2 = {
  clamp(v,a,b){ return Math.max(a,Math.min(b,v)); },
  onScroll(){
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const gp = max>0 ? window.scrollY/max : 0;
    const prog = document.querySelector('[data-six-progress]');
    if(prog) prog.style.height = (gp*100).toFixed(1)+'%';
    const coords = document.querySelector('[data-six-coords]');
    if(coords) coords.textContent = 'LAT 06.660 // LON −06.066 // ALT '+String(Math.round(gp*660)).padStart(4,'0')+'m';

    const ih = window.innerHeight;
    document.querySelectorAll('[data-scene]').forEach(scene=>{
      const r = scene.getBoundingClientRect();
      const p = this.clamp((ih - r.top)/(ih + r.height), 0, 1);
      scene.querySelectorAll('[data-depth]').forEach(el=>{
        const d = parseFloat(el.dataset.depth)||0;
        el.style.transform = 'translate3d(0,'+((p-0.5)*d).toFixed(1)+'px,0)';
      });
      // tower orbit
      if(scene.dataset.scene==='exterior'){
        const box = scene.querySelector('[data-tower]');
        if(box) box.style.transform = 'rotateX(5deg) rotateY('+(-46 + p*60).toFixed(1)+'deg) scale('+(0.88 + p*0.28).toFixed(3)+')';
      }
    });
    // reveal
    document.querySelectorAll('[data-reveal]').forEach(el=>{
      const r = el.getBoundingClientRect();
      if(r.top < ih*0.86 && r.bottom > 0){ el.style.opacity='1'; el.style.transform='none'; }
    });
    // phase label
    const phase = document.querySelector('[data-six-phase]');
    if(phase){
      let label='APPROACH';
      const names=[['boot','BOOT'],['exterior','APPROACH'],['interior','COMMAND'],['pillars','PILLARS'],['manifesto','MANIFESTO'],['founder','ORIGIN'],['spaces','WORKSPACE'],['console','COMMAND'],['close','SOVEREIGN']];
      for(const [sel,nm] of names){ const s=document.querySelector('[data-scene="'+sel+'"]'); if(s){ const r=s.getBoundingClientRect(); if(r.top<=ih*0.5 && r.bottom>=ih*0.5){ label=nm; } } }
      phase.textContent='PHASE // '+label;
    }
  },
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
  },
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
      if (b.layer === 1) { ctx.strokeStyle = 'rgba(248,226,49,0.07)'; ctx.lineWidth = 1; ctx.strokeRect(b.x, bY, b.w, b.h);
        // gold logo on buildings wide enough
        // gold logo on buildings
        const logo=this._bldgLogo||null;
        if(logo && b.w>60){
          const sz=Math.min(b.w*0.45,44), lx=b.x+b.w/2-sz/2, ly=bY+b.h*0.1;
          const glow=0.4+0.25*Math.sin(t*0.35+b.x*0.01);
          ctx.save(); ctx.globalAlpha=0.6+0.2*glow;
          ctx.shadowColor='rgba(248,226,49,0.9)'; ctx.shadowBlur=Math.round(10*glow);
          ctx.drawImage(logo,lx,ly,sz,sz);
          ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.restore();
        }
      }
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
  },
  initManhattanBg() {
    const canvas = document.getElementById('manhattanBg');
    if (!canvas || this._manhattanInit) return;
    this._manhattanInit = true;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; this._buildManhattan(canvas); };
    window.addEventListener('resize', resize);
    resize();
    const loop = (ts) => { this._drawManhattan(ts); this._mraf = requestAnimationFrame(loop); };
    this._mraf = requestAnimationFrame(loop);
  },
  initBgMesh(){
    const canvas=document.getElementById('bgMesh'); if(!canvas) return;
    const ctx=canvas.getContext('2d');
    let W=0,H=0; const DPR=Math.min(window.devicePixelRatio||1,2);
    let nodes=[], sky=[];
    const seedNodes=()=>{ nodes=[]; const n=Math.max(35,Math.min(65,Math.floor((W*H)/28000)));
      for(let i=0;i<n;i++) nodes.push({x:Math.random()*W,y:Math.random()*H*0.85,vx:(Math.random()-.5)*.055,vy:(Math.random()-.5)*.055,r:Math.random()*2.4+1.0,ph:Math.random()*6.28}); };
    const buildSkyline=()=>{
      sky=[];
      // 6 Empire Corporation towers only
      const defs=[
        {cx:0.08, w:0.085,h:0.40, emblem:true, tiers:[[0.78,16],[0.55,14],[0.35,12]]},
        {cx:0.24, w:0.09, h:0.48, emblem:true, tiers:[[0.76,18],[0.52,15],[0.32,13]]},
        {cx:0.38, w:0.08, h:0.36, emblem:true, tiers:[[0.75,14],[0.5,12]]},
        {cx:0.50, w:0.11, h:0.65, empire:true, sign:'6-EMPIRES', tiers:[[0.80,22],[0.58,18],[0.38,16],[0.22,14]]},
        {cx:0.64, w:0.08, h:0.42, emblem:true, tiers:[[0.77,15],[0.54,13],[0.33,11]]},
        {cx:0.78, w:0.085,h:0.38, emblem:true, tiers:[[0.75,14],[0.5,12]]},
        {cx:0.93, w:0.08, h:0.44, emblem:true, tiers:[[0.78,16],[0.54,13]]},
      ];
      for(const d of defs){
        const w=d.w*W, x=d.cx*W - w/2, h=d.h*H;
        const cols=Math.max(2,Math.floor(w/13)), rows=Math.max(2,Math.floor(h/15)), wins=[];
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ if(Math.random()<0.48) wins.push({c,r,ph:Math.random()*6.28,sp:0.4+Math.random()*1.0}); }
        sky.push({x,w,h,empire:!!d.empire,sign:d.sign||null,emblem:!!d.emblem,tiers:d.tiers||null,cols,rows,wins});
      }
    };
    const drawUFO=(ctx,x,y,sz,t,ph)=>{
      ctx.save();
      ctx.translate(x,y);
      // tractor beam
      const beam=ctx.createLinearGradient(0,0,0,sz*2.2);
      beam.addColorStop(0,'rgba(248,226,49,.12)'); beam.addColorStop(1,'rgba(248,226,49,0)');
      ctx.fillStyle=beam;
      ctx.beginPath(); ctx.moveTo(-sz*0.6,sz*0.3); ctx.lineTo(sz*0.6,sz*0.3); ctx.lineTo(sz*0.35,sz*2.2); ctx.lineTo(-sz*0.35,sz*2.2); ctx.closePath(); ctx.fill();
      // hull
      const hg=ctx.createLinearGradient(0,-sz*0.5,0,sz*0.35);
      hg.addColorStop(0,'rgba(40,42,50,.95)'); hg.addColorStop(1,'rgba(20,22,28,.9)');
      ctx.fillStyle=hg;
      ctx.beginPath(); ctx.ellipse(0,0,sz,sz*0.28,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(248,226,49,.45)'; ctx.lineWidth=.8;
      ctx.beginPath(); ctx.ellipse(0,0,sz,sz*0.28,0,0,Math.PI*2); ctx.stroke();
      // dome
      ctx.fillStyle='rgba(248,226,49,.08)';
      ctx.beginPath(); ctx.ellipse(0,-sz*0.15,sz*0.42,sz*0.32,0,Math.PI,0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(248,226,49,.25)'; ctx.lineWidth=.7;
      ctx.beginPath(); ctx.ellipse(0,-sz*0.15,sz*0.42,sz*0.32,0,Math.PI,0); ctx.closePath(); ctx.stroke();
      // signal lights (pulsing ring)
      const nLights=6;
      for(let i=0;i<nLights;i++){
        const a=i*(Math.PI*2/nLights)+t*0.4+ph;
        const lx=Math.cos(a)*sz*0.72, ly=Math.sin(a)*sz*0.19;
        const pulse=0.3+0.7*Math.abs(Math.sin(t*2.5+i*1.1+ph));
        const col=i%2===0?'rgba(248,226,49,':'rgba(80,220,255,';
        ctx.fillStyle=col+pulse.toFixed(2)+')';
        ctx.shadowColor=i%2===0?'#F8E231':'#50dcff'; ctx.shadowBlur=6*pulse;
        ctx.beginPath(); ctx.arc(lx,ly,sz*0.07,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      ctx.restore();
    };
    // fleet of UFOs (different sizes, speeds, heights)
    const ufos=[
      {x:-140,y:0,sz:18,speed:0.018,bobPh:0.0, yFrac:0.18},
      {x:-80, y:0,sz:10,speed:0.010,bobPh:1.4, yFrac:0.32},
      {x:200, y:0,sz:26,speed:0.025,bobPh:2.8, yFrac:0.12},
      {x:600, y:0,sz:8, speed:0.008,bobPh:4.2, yFrac:0.42},
      {x:400, y:0,sz:14,speed:0.014,bobPh:5.6, yFrac:0.25},
    ];
    const drawAtlas=(ctx,x,y,sz,t,ph)=>{
      ctx.save(); ctx.translate(x,y);
      const pulse=0.5+0.3*Math.sin(t*0.8+ph);
      // core sphere
      const cg=ctx.createRadialGradient(0,0,0,0,0,sz);
      cg.addColorStop(0,'rgba(248,226,49,0.18)'); cg.addColorStop(0.6,'rgba(40,60,120,0.12)'); cg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,0,sz,0,Math.PI*2); ctx.fill();
      // inner ring
      ctx.strokeStyle='rgba(248,226,49,'+(0.5*pulse).toFixed(2)+')'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(0,0,sz*0.4,0,Math.PI*2); ctx.stroke();
      // rotating solar panels (2 arms)
      const rot=t*0.15+ph;
      for(let arm=0;arm<2;arm++){
        ctx.save(); ctx.rotate(rot+arm*Math.PI);
        // arm strut
        ctx.strokeStyle='rgba(180,180,220,'+(0.55*pulse).toFixed(2)+')'; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(sz*0.4,0); ctx.lineTo(sz*1.6,0); ctx.stroke();
        // panel
        ctx.fillStyle='rgba(248,226,49,'+(0.22*pulse).toFixed(2)+')';
        ctx.strokeStyle='rgba(248,226,49,'+(0.45*pulse).toFixed(2)+')';
        ctx.fillRect(sz*1.05,-sz*0.35,sz*0.55,sz*0.7);
        ctx.strokeRect(sz*1.05,-sz*0.35,sz*0.55,sz*0.7);
        // panel grid lines
        ctx.strokeStyle='rgba(248,226,49,'+(0.15*pulse).toFixed(2)+')'; ctx.lineWidth=0.5;
        ctx.beginPath(); ctx.moveTo(sz*1.33,-sz*0.35); ctx.lineTo(sz*1.33,sz*0.35); ctx.stroke();
        ctx.restore();
      }
      // signal dish
      ctx.save(); ctx.rotate(-rot*0.7);
      ctx.strokeStyle='rgba(100,220,255,'+(0.5*pulse).toFixed(2)+')'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,-sz*0.4); ctx.lineTo(0,-sz*0.9); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,-sz*0.9,sz*0.22,sz*0.1,0,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // data pulse rings
      for(let ring=1;ring<=3;ring++){
        const rph=(t*0.6+ph+ring*1.0)%3;
        const rp=rph/3, rr=sz*(0.5+rp*2.5), al=(1-rp)*0.25*pulse;
        ctx.strokeStyle='rgba(248,226,49,'+al.toFixed(2)+')'; ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.stroke();
      }
      ctx.restore();
    };
    if(!this._atlases){
      this._atlases=[
        {x:-300,y:0,sz:14,speed:0.022,yFrac:0.14,ph:0},
        {x:500, y:0,sz:10,speed:0.012,yFrac:0.52,ph:2.1},
        {x:200, y:0,sz:18,speed:0.016,yFrac:0.31,ph:4.3},
      ];
    }
    const resize=()=>{ W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0); this._stars=null; this._planets=null; this._bgPyramids=null; if(this._atlases) this._atlases.forEach(a=>{a.y=H*a.yFrac;a.ySet=true;}); seedNodes(); buildSkyline(); ufos.forEach(u=>u.y=H*u.yFrac); };
    // load logos for buildings — strip white background
    const stripWhiteBg=(img)=>{
      const oc=document.createElement('canvas'); oc.width=img.naturalWidth; oc.height=img.naturalHeight;
      const ox=oc.getContext('2d'); ox.drawImage(img,0,0);
      const d=ox.getImageData(0,0,oc.width,oc.height);
      for(let i=0;i<d.data.length;i+=4){
        const r=d.data[i],g=d.data[i+1],b=d.data[i+2];
        // gold: strong red-blue gap, red dominant
        const goldGap=r-b;
        if(goldGap<70||r<80){
          d.data[i+3]=0;
        } else {
          // smooth edge based on gold strength
          d.data[i+3]=Math.min(255,Math.round((goldGap-70)*4));
        }
      }
      ox.putImageData(d,0,0); return oc;
    };
    if(!this._bldgLogo){
      const img=new Image(); img.src='6-empire-logo-gold3.png';
      img.onload=()=>{ this._bldgLogo=stripWhiteBg(img); };
    }
    resize(); this._bgResize=resize; window.addEventListener('resize',resize);
    const drawSun=(ctx,cx,cy,r,al,t)=>{
      ctx.save(); ctx.globalAlpha=al;
      // rays
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6+t*0.3, r2=r*1.5+Math.sin(t*2+i)*3;
        ctx.strokeStyle='rgba(248,226,49,.6)'; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r*1.1,cy+Math.sin(a)*r*1.1);
        ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2); ctx.stroke();
      }
      // circle
      const sg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      sg.addColorStop(0,'rgba(248,226,49,.6)'); sg.addColorStop(1,'rgba(248,226,49,.08)');
      ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(248,226,49,.4)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      ctx.restore();
    };
    const drawEye=(ctx,cx,cy,sz,al,t)=>{
      ctx.save(); ctx.globalAlpha=al;
      ctx.strokeStyle='rgba(248,226,49,.7)'; ctx.lineWidth=1.2;
      // eye outline
      ctx.beginPath();
      ctx.moveTo(cx-sz,cy);
      ctx.quadraticCurveTo(cx,cy-sz*0.55,cx+sz,cy);
      ctx.quadraticCurveTo(cx,cy+sz*0.55,cx-sz,cy);
      ctx.stroke();
      // iris
      const ig=ctx.createRadialGradient(cx,cy,0,cx,cy,sz*0.38);
      ig.addColorStop(0,'rgba(248,226,49,.5)'); ig.addColorStop(1,'rgba(248,226,49,.08)');
      ctx.fillStyle=ig; ctx.beginPath(); ctx.arc(cx,cy,sz*0.38,0,Math.PI*2); ctx.fill();
      // pupil
      ctx.fillStyle='rgba(5,6,8,.8)'; ctx.beginPath(); ctx.arc(cx,cy,sz*0.16,0,Math.PI*2); ctx.fill();
      // pupil glow
      ctx.fillStyle='rgba(248,226,49,'+(0.4+0.4*Math.sin(t*1.5)).toFixed(2)+')';
      ctx.beginPath(); ctx.arc(cx,cy,sz*0.08,0,Math.PI*2); ctx.fill();
      // lashes (top)
      for(let i=-2;i<=2;i++){
        const lx=cx+i*(sz*0.35), la=Math.PI*1.4+i*0.15;
        ctx.strokeStyle='rgba(248,226,49,.35)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(lx,cy-sz*0.5);
        ctx.lineTo(lx+Math.cos(la)*10,cy-sz*0.5-10); ctx.stroke();
      }
      ctx.restore();
    };
    const drawOwl=(ctx,cx,cy,sz,al,t)=>{
      ctx.save(); ctx.globalAlpha=al;
      ctx.strokeStyle='rgba(248,226,49,.55)'; ctx.lineWidth=1.2;
      // body
      ctx.beginPath(); ctx.ellipse(cx,cy+sz*0.2,sz*0.55,sz*0.7,0,0,Math.PI*2);
      ctx.fillStyle='rgba(15,17,22,.7)'; ctx.fill(); ctx.stroke();
      // wings hint
      ctx.beginPath(); ctx.ellipse(cx-sz*0.7,cy+sz*0.3,sz*0.35,sz*0.5,Math.PI/5,0,Math.PI*2);
      ctx.fillStyle='rgba(12,14,18,.6)'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx+sz*0.7,cy+sz*0.3,sz*0.35,sz*0.5,-Math.PI/5,0,Math.PI*2);
      ctx.fill(); ctx.stroke();
      // left eye
      const eyePulse=0.4+0.5*Math.abs(Math.sin(t*1.2));
      ctx.fillStyle='rgba(248,226,49,'+eyePulse.toFixed(2)+')';
      ctx.beginPath(); ctx.arc(cx-sz*0.22,cy-sz*0.12,sz*0.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(5,6,8,.9)'; ctx.beginPath(); ctx.arc(cx-sz*0.22,cy-sz*0.12,sz*0.1,0,Math.PI*2); ctx.fill();
      // right eye
      ctx.fillStyle='rgba(248,226,49,'+eyePulse.toFixed(2)+')';
      ctx.beginPath(); ctx.arc(cx+sz*0.22,cy-sz*0.12,sz*0.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(5,6,8,.9)'; ctx.beginPath(); ctx.arc(cx+sz*0.22,cy-sz*0.12,sz*0.1,0,Math.PI*2); ctx.fill();
      // beak
      ctx.fillStyle='rgba(248,226,49,.5)';
      ctx.beginPath(); ctx.moveTo(cx,cy+sz*0.05); ctx.lineTo(cx-sz*0.1,cy+sz*0.22); ctx.lineTo(cx+sz*0.1,cy+sz*0.22); ctx.closePath(); ctx.fill();
      // ear tufts
      ctx.strokeStyle='rgba(248,226,49,.4)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(cx-sz*0.25,cy-sz*0.38); ctx.lineTo(cx-sz*0.32,cy-sz*0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+sz*0.25,cy-sz*0.38); ctx.lineTo(cx+sz*0.32,cy-sz*0.7); ctx.stroke();
      ctx.restore();
    };
    const drawPyramid=(ctx,cx,cy,sz,al,t,rot)=>{
      ctx.save(); ctx.globalAlpha=al;
      ctx.translate(cx,cy); ctx.rotate(rot||0); ctx.translate(-cx,-cy);
      const pulse=0.7+0.3*Math.sin(t*0.6);
      // outer glow
      const pg=ctx.createRadialGradient(cx,cy,0,cx,cy,sz*1.2);
      pg.addColorStop(0,'rgba(248,226,49,'+(0.18*pulse).toFixed(3)+')'); pg.addColorStop(1,'rgba(248,226,49,0)');
      ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(cx,cy,sz*1.2,0,Math.PI*2); ctx.fill();
      // pyramid faces
      const apex=[cx,cy-sz], bl=[cx-sz*0.85,cy+sz*0.55], br=[cx+sz*0.85,cy+sz*0.55];
      // left face
      ctx.beginPath(); ctx.moveTo(...apex); ctx.lineTo(...bl); ctx.lineTo(cx,cy+sz*0.55); ctx.closePath();
      ctx.fillStyle='rgba(248,226,49,'+(0.08*pulse).toFixed(3)+')'; ctx.fill();
      // right face
      ctx.beginPath(); ctx.moveTo(...apex); ctx.lineTo(cx,cy+sz*0.55); ctx.lineTo(...br); ctx.closePath();
      ctx.fillStyle='rgba(248,226,49,'+(0.14*pulse).toFixed(3)+')'; ctx.fill();
      // outline
      ctx.strokeStyle='rgba(248,226,49,'+(0.55*pulse).toFixed(3)+')'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(...apex); ctx.lineTo(...bl); ctx.lineTo(...br); ctx.closePath(); ctx.stroke();
      // base line
      ctx.strokeStyle='rgba(248,226,49,'+(0.3*pulse).toFixed(3)+')'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(...bl); ctx.lineTo(...br); ctx.stroke();
      // eye of pyramid
      const eyeY=cy-sz*0.15;
      ctx.strokeStyle='rgba(248,226,49,'+(0.6*pulse).toFixed(3)+')'; ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(cx-sz*0.2,eyeY); ctx.quadraticCurveTo(cx,eyeY-sz*0.14,cx+sz*0.2,eyeY);
      ctx.quadraticCurveTo(cx,eyeY+sz*0.14,cx-sz*0.2,eyeY); ctx.stroke();
      ctx.fillStyle='rgba(248,226,49,'+(0.45+0.35*Math.sin(t*1.8)).toFixed(3)+')';
      ctx.beginPath(); ctx.arc(cx,eyeY,sz*0.055,0,Math.PI*2); ctx.fill();
      // scan lines
      for(let i=1;i<=4;i++){
        const ly=cy-sz+i*(sz*1.55/5);
        const spread=((ly-(cy-sz))/(sz*1.55))*(sz*0.85);
        ctx.strokeStyle='rgba(248,226,49,'+(0.06*pulse).toFixed(3)+')'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(cx-spread,ly); ctx.lineTo(cx+spread,ly); ctx.stroke();
      }
      ctx.restore();
    };
    const symbols=[
      {type:'sun',  x:0.15, y:0.30, ph:0,   period:23, dur:7},
      {type:'sun',    x:0.62, y:0.70, ph:15,  period:37, dur:5},
    ];
    let f=0;
    const draw=()=>{
      f++; const t=f/60;
      ctx.fillStyle='#010103'; ctx.fillRect(0,0,W,H);
      const vig=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.55);
      vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.45)');
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
      // ── SPACE LAYER: nebula clouds + star field ──────────────────────
      if(!this._stars || this._stars._W!==W || this._stars._H!==H){
        this._stars={_W:W,_H:H,pts:[]};
        for(let i=0;i<320;i++) this._stars.pts.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+0.2,ph:Math.random()*6.28,sp:0.3+Math.random()*1.4,col:Math.random()<0.12?'rgba(190,220,255,':'rgba(248,226,49,'});
      }
      // nebula blobs
      const nebDefs=[[W*0.18,H*0.22,W*0.28,H*0.22,'rgba(60,20,90,.08)','rgba(248,120,40,.03)'],
                     [W*0.72,H*0.55,W*0.22,H*0.18,'rgba(20,40,100,.07)','rgba(248,226,49,.02)'],
                     [W*0.44,H*0.78,W*0.3, H*0.2, 'rgba(30,60,80,.06)', 'rgba(100,220,255,.02)']];
      for(const [nx,ny,rw,rh,c0,c1] of nebDefs){
        ctx.save();
        ctx.scale(1,rh/rw);
        const ng=ctx.createRadialGradient(nx,ny*(rw/rh),0,nx,ny*(rw/rh),rw);
        ng.addColorStop(0,c0); ng.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(nx,ny*(rw/rh),rw,0,Math.PI*2); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.scale(1,rh/rw);
        const ng2=ctx.createRadialGradient(nx,ny*(rw/rh),0,nx,ny*(rw/rh),rw*0.5);
        ng2.addColorStop(0,c1); ng2.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=ng2; ctx.beginPath(); ctx.arc(nx,ny*(rw/rh),rw*0.5,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      // milky way streak
      ctx.save();
      ctx.rotate(-0.22);
      const mw=ctx.createLinearGradient(0,H*0.3,W*1.4,H*0.7);
      mw.addColorStop(0,'rgba(0,0,0,0)'); mw.addColorStop(0.3,'rgba(80,60,120,.03)'); mw.addColorStop(0.5,'rgba(120,100,180,.05)'); mw.addColorStop(0.7,'rgba(80,60,120,.03)'); mw.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=mw; ctx.fillRect(0,0,W*1.8,H*1.4);
      ctx.restore();
      // stars
      for(const s of this._stars.pts){
        const tw=0.12+0.18*Math.abs(Math.sin(t*s.sp+s.ph));
        ctx.fillStyle=s.col+tw.toFixed(2)+')';
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,6.2832); ctx.fill();
        if(s.r>1.0){ ctx.strokeStyle=s.col+'0.08)'; ctx.lineWidth=s.r+1;
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r*2.5,0,6.2832); ctx.stroke(); }
      }
      // ─────────────────────────────────────────────────────────────────
      // PLANETS
      if(!this._planets || this._planets._W!==W){
        const palettes=[
          ['#1a3a6e','#2a5fa8','#4a8fd4'],['#6e1a1a','#a83030','#d46060'],
          ['#1a5c2a','#2a9c46','#60d480'],['#5c3a1a','#9c6430','#d49e60'],
          ['#3a1a6e','#6a30c0','#a870f0'],['#1a5c5c','#2aa0a0','#60d4d4'],
        ];
        this._planets={_W:W,pts:[]};
        const sizes=[14,20,32];
        for(let i=0;i<3;i++){
          const r=sizes[Math.floor(Math.random()*sizes.length)]*(0.7+Math.random()*0.6);
          const pal=palettes[Math.floor(Math.random()*palettes.length)];
          this._planets.pts.push({
            x:Math.random()*W, y:Math.random()*H*0.88, r,
            vx:(Math.random()-.5)*0.018, vy:(Math.random()-.5)*0.006,
            pal, hasRing:Math.random()<0.35, ringAngle:Math.random()*Math.PI,
            tiltX:0.25+Math.random()*0.5, ph:Math.random()*6.28
          });
        }
      }
      for(const p of this._planets.pts){
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<-p.r*4)p.x=W+p.r*2; if(p.x>W+p.r*4)p.x=-p.r*2;
        if(p.y<-p.r*3)p.y=H*0.88+p.r; if(p.y>H*0.9+p.r)p.y=-p.r;
        ctx.save();
        // ring behind
        if(p.hasRing){
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.ringAngle);
          ctx.scale(1,p.tiltX*0.35);
          const rg=ctx.createLinearGradient(-p.r*2.2,0,p.r*2.2,0);
          rg.addColorStop(0,'rgba(0,0,0,0)'); rg.addColorStop(0.3,p.pal[0]+'99');
          rg.addColorStop(0.5,p.pal[1]+'cc'); rg.addColorStop(0.7,p.pal[0]+'99'); rg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.strokeStyle=rg; ctx.lineWidth=p.r*0.28;
          ctx.beginPath(); ctx.ellipse(0,0,p.r*2.0,p.r*0.22,0,0,Math.PI*2); ctx.stroke();
          ctx.restore();
        }
        // planet sphere
        const pg=ctx.createRadialGradient(p.x-p.r*0.3,p.y-p.r*0.3,p.r*0.05,p.x,p.y,p.r);
        pg.addColorStop(0,p.pal[2]); pg.addColorStop(0.5,p.pal[1]); pg.addColorStop(1,'rgba(0,0,0,0.85)');
        ctx.fillStyle=pg; ctx.globalAlpha=0.45;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        // atmosphere glow
        const ag=ctx.createRadialGradient(p.x,p.y,p.r*0.7,p.x,p.y,p.r*1.35);
        ag.addColorStop(0,'rgba(0,0,0,0)'); ag.addColorStop(1,p.pal[1]+'22');
        ctx.fillStyle=ag; ctx.globalAlpha=0.6;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*1.35,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      // PYRAMIDS (slow drifting)
      if(!this._bgPyramids){
        this._bgPyramids=[
          {x:W*0.12,y:H*0.62,sz:28,vx:0.009,vy:0.004,rot:0,rotV:0.0008,ph:0},
          {x:W*0.82,y:H*0.28,sz:22,vx:-0.007,vy:0.003,rot:1.2,rotV:-0.0006,ph:2},
        ];
      }
      for(const py of this._bgPyramids){
        py.x+=py.vx; py.y+=py.vy; py.rot+=py.rotV;
        if(py.x<-py.sz*3)py.x=W+py.sz; if(py.x>W+py.sz*3)py.x=-py.sz;
        if(py.y<-py.sz*3)py.y=H+py.sz; if(py.y>H+py.sz)py.y=-py.sz;
        const al=0.07+0.04*Math.sin(t*0.4+py.ph);
        drawPyramid(ctx,py.x,py.y,py.sz,al,t,py.rot);
      }
      // left-side darkness veil
      const leftVeil=ctx.createLinearGradient(0,0,W*0.42,0);
      leftVeil.addColorStop(0,'rgba(0,0,0,0.72)'); leftVeil.addColorStop(0.6,'rgba(0,0,0,0.28)'); leftVeil.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=leftVeil; ctx.fillRect(0,0,W*0.42,H);
      // mystic hidden symbols — left zone, appear/disappear slowly
      const mysticSlots=[
        {x:0.07,y:0.22,period:18,dur:5,ph:0,  type:'pyramid'},
        {x:0.14,y:0.58,period:24,dur:6,ph:7,  type:'rune'},
        {x:0.05,y:0.75,period:31,dur:7,ph:14, type:'eye'},
        {x:0.20,y:0.38,period:27,dur:5,ph:3,  type:'pyramid'},
        {x:0.10,y:0.87,period:22,dur:6,ph:9,  type:'rune'},
      ];
      for(const s of mysticSlots){
        const cycle=(t+s.ph)%s.period, pos=cycle/s.period, winEnd=s.dur/s.period;
        let al=0;
        if(pos<winEnd){ const h=winEnd/2; al=pos<h?pos/h:1-(pos-h)/h; al=Math.max(0,Math.min(1,al))*0.28; }
        if(al<0.005) continue;
        const sx=s.x*W, sy=s.y*H;
        ctx.save(); ctx.globalAlpha=al;
        if(s.type==='eye') drawEye(ctx,sx,sy,22,1,t);
        else if(s.type==='pyramid' || s.type==='sigil'){
          // mini pyramid
          const r=18, rot=t*0.06+s.ph;
          ctx.save(); ctx.translate(sx,sy); ctx.rotate(rot);
          ctx.strokeStyle='rgba(248,226,49,0.85)'; ctx.lineWidth=1.1;
          ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(r*0.87,r*0.55); ctx.lineTo(-r*0.87,r*0.55); ctx.closePath(); ctx.stroke();
          ctx.strokeStyle='rgba(248,226,49,0.45)'; ctx.lineWidth=0.8;
          ctx.beginPath(); ctx.moveTo(0,-r*0.3); ctx.lineTo(r*0.45,r*0.55); ctx.lineTo(-r*0.45,r*0.55); ctx.closePath(); ctx.stroke();
          ctx.fillStyle='rgba(248,226,49,'+(0.5+0.4*Math.sin(t*1.6+s.ph)).toFixed(2)+')';
          ctx.beginPath(); ctx.arc(0,-r,2.5,0,Math.PI*2); ctx.fill();
          ctx.restore();
        } else if(s.type==='rune'){
          // rune: vertical staff + 2 branches
          const rh=20, rot=t*0.05+s.ph;
          ctx.strokeStyle='rgba(248,226,49,0.85)'; ctx.lineWidth=1.2;
          ctx.save(); ctx.translate(sx,sy); ctx.rotate(rot);
          ctx.beginPath(); ctx.moveTo(0,-rh); ctx.lineTo(0,rh); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0,-rh*0.3); ctx.lineTo(rh*0.6,-rh*0.7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0,rh*0.2); ctx.lineTo(rh*0.6,-rh*0.1); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0,-rh*0.3); ctx.lineTo(-rh*0.4,-rh*0.6); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      const ax=-W*0.03, ay=H*0.5;
      for(let i=1;i<=8;i++){ const rad=i*Math.min(W,H)*0.08 + Math.sin(t*0.25+i)*4;
        ctx.strokeStyle='rgba(248,226,49,'+Math.max(0,0.09-i*0.008).toFixed(3)+')'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(ax,ay,rad,-0.35,1.7); ctx.stroke(); }
      // drifting constellation mesh
      for(const p of nodes){ p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x+=W; else if(p.x>W)p.x-=W;
        const yb=H*0.85; if(p.y<0)p.y+=yb; else if(p.y>yb)p.y-=yb; }
      for(let i=0;i<nodes.length;i++){ const a=nodes[i];
        for(let j=i+1;j<nodes.length;j++){ const b=nodes[j]; const dx=a.x-b.x,dy=a.y-b.y;
          if(dx>280||dx<-280||dy>280||dy<-280) continue; const d=Math.hypot(dx,dy);
          if(d<300){ const al=(1-d/300)*0.45; ctx.strokeStyle='rgba(230,200,40,'+al.toFixed(3)+')'; ctx.lineWidth=.9;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } }
      for(const p of nodes){ const tw=0.5+0.5*Math.sin(t*1.1+p.ph);
        ctx.fillStyle='rgba(248,226,49,'+(0.55+0.45*tw).toFixed(3)+')';
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r+0.4,0,6.2832); ctx.fill(); }
      // hidden symbols (fade in/out on cycle)
      for(const s of symbols){
        const cycle=t+s.ph, pos=(cycle%s.period)/s.period;
        const winStart=0, winEnd=s.dur/s.period;
        let al=0;
        if(pos<winEnd){ const half=winEnd/2; al=pos<half?pos/half:1-(pos-half)/half; al=Math.max(0,Math.min(1,al))*0.38; }
        if(al>0.005){
          const cx=s.x*W, cy=s.y*H;
          if(s.type==='sun') drawSun(ctx,cx,cy,28,al,t);
          else if(s.type==='eye') drawEye(ctx,cx,cy,32,al,t);
          else if(s.type==='owl') drawOwl(ctx,cx,cy,26,al,t);
          else if(s.type==='pyramid'){
            const drift=s.drift?Math.sin(t*0.07+s.ph)*W*0.06:0;
            const driftY=s.drift?Math.cos(t*0.05+s.ph)*H*0.04:0;
            const rot=t*0.12+s.ph;
            drawPyramid(ctx,cx+drift,cy+driftY,44,al,t,rot);
          }
        }
      }
      // hypnotic spiral vortex (always on, very faint)
      ctx.save();
      const spiralCx=W*0.5, spiralCy=H*0.42;
      for(let ring=1;ring<=6;ring++){
        const r=ring*Math.min(W,H)*0.055;
        const phase=t*0.18*(ring%2===0?1:-1);
        ctx.strokeStyle='rgba(248,226,49,'+(0.03-ring*0.004).toFixed(3)+')';
        ctx.lineWidth=1;
        ctx.beginPath();
        for(let a=0;a<=Math.PI*2;a+=0.08){
          const rx=spiralCx+Math.cos(a+phase)*r;
          const ry=spiralCy+Math.sin(a+phase)*r*(0.38+0.12*Math.sin(t*0.4+ring));
          a===0?ctx.moveTo(rx,ry):ctx.lineTo(rx,ry);
        }
        ctx.closePath(); ctx.stroke();
      }
      ctx.restore();
      // AI Atlas satellites
      if(!this._atlases[0].ySet){ this._atlases.forEach(a=>{ a.y=H*a.yFrac; a.ySet=true; }); }
      for(const a of this._atlases){
        a.x+=a.speed; a.y+=Math.sin(t*0.18+a.ph)*0.06;
        if(a.x>W+a.sz*5){ a.x=-(a.sz*6); a.y=H*(0.08+Math.random()*0.55); }
        drawAtlas(ctx,a.x,a.y,a.sz,t,a.ph);
      }
      // UFO fleet
      for(const u of ufos){
        u.x+=u.speed; u.bobPh+=0.012;
        if(u.x>W+200){ u.x=-(u.sz*8); u.y=H*(0.08+Math.random()*0.45); }
        const ufoY=u.y+Math.sin(u.bobPh)*14;
        drawUFO(ctx,u.x,ufoY,u.sz,t,u.bobPh);
      }
      // Empire State skyline
      this.drawSkyline(ctx,W,H,sky,t);
      this._bgRaf=requestAnimationFrame(draw);
    };
    this._bgRaf=requestAnimationFrame(draw);
  },
  drawSkyline(ctx,W,H,sky,t){
    // Draw each building with its profile
    for(const b of sky){
      const topY=H-b.h;
      const mx=b.x+b.w/2;
      // main body
      const g=ctx.createLinearGradient(0,topY,0,H);
      if(b.empire){
        g.addColorStop(0,'rgba(6,5,1,1.0)'); g.addColorStop(0.3,'rgba(3,4,7,1.0)'); g.addColorStop(1,'rgba(0,1,2,1.0)');
      } else {
        g.addColorStop(0,'rgba(3,4,7,1.0)'); g.addColorStop(1,'rgba(0,1,2,1.0)');
      }
      ctx.fillStyle=g; ctx.fillRect(b.x,topY,b.w,b.h);
      // luxury gold shimmer for empire tower
      if(b.empire){
        const shimmer=ctx.createLinearGradient(b.x,0,b.x+b.w,0);
        const sp=0.5+0.5*Math.sin(t*0.5);
        shimmer.addColorStop(0,'rgba(248,226,49,0)');
        shimmer.addColorStop(sp*0.5,'rgba(248,226,49,0.06)');
        shimmer.addColorStop(sp,'rgba(248,226,49,0.12)');
        shimmer.addColorStop(Math.min(1,sp+0.3),'rgba(248,226,49,0.04)');
        shimmer.addColorStop(1,'rgba(248,226,49,0)');
        ctx.fillStyle=shimmer; ctx.fillRect(b.x,topY,b.w,b.h);
      }
      ctx.strokeStyle='rgba(248,226,49,0.6)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(b.x,topY); ctx.lineTo(b.x+b.w,topY); ctx.stroke();
      // luxury edge glow
      ctx.strokeStyle='rgba(248,226,49,0.18)';
      ctx.beginPath(); ctx.moveTo(b.x,topY); ctx.lineTo(b.x,H); ctx.moveTo(b.x+b.w,topY); ctx.lineTo(b.x+b.w,H); ctx.stroke();
      // windows
      const cw=b.w/b.cols, rh=16;
      for(const w of b.wins){ const wx=b.x+w.c*cw+cw*0.28, wy=topY+9+w.r*rh; if(wy>H-4) continue;
        const lit=0.25+0.50*(0.5+0.5*Math.sin(t*w.sp+w.ph));
        ctx.fillStyle='rgba(248,226,49,'+lit.toFixed(3)+')';
        ctx.fillRect(wx,wy,Math.max(2,cw*0.36),3); }
      // NYC setback tiers (all buildings get 1-3 setbacks based on height)
      if(b.tiers){
        let ty=topY;
        for(const tr of b.tiers){
          const ntw=b.w*tr[0], th=tr[1], ntx=b.x+(b.w-ntw)/2;
          ctx.fillStyle='rgba(18,22,30,0.96)'; ctx.fillRect(ntx,ty-th,ntw,th);
          ctx.strokeStyle='rgba(248,226,49,'+(b.empire?0.45:0.28)+')'; ctx.lineWidth=1;
          ctx.strokeRect(ntx+.5,ty-th+.5,ntw-1,th-1);
          // tier windows
          const tcw=ntw/Math.max(2,Math.floor(ntw/14));
          for(let c=0;c<Math.floor(ntw/14);c++){
            const lit=0.2+0.3*(0.5+0.5*Math.sin(t*0.8+c+ty));
            ctx.fillStyle='rgba(248,226,49,'+lit.toFixed(2)+')';
            ctx.fillRect(ntx+c*tcw+tcw*0.3,ty-th+6,Math.max(2,tcw*0.3),3);
          }
          ty-=th;
        }
        // spire/antenna
        const mastH=b.h*(b.empire?0.22:0.10);
        const mg=ctx.createLinearGradient(0,ty-mastH,0,ty);
        mg.addColorStop(0,'rgba(248,226,49,0)'); mg.addColorStop(1,'rgba(248,226,49,0.7)');
        ctx.strokeStyle=mg; ctx.lineWidth=b.empire?2:1.2;
        ctx.beginPath(); ctx.moveTo(mx,ty); ctx.lineTo(mx,ty-mastH); ctx.stroke();
        // beacon
        const bl=0.5+0.5*Math.sin(t*2.5);
        ctx.fillStyle='rgba(248,226,49,'+(0.5+0.45*bl).toFixed(2)+')';
        ctx.beginPath(); ctx.arc(mx,ty-mastH,b.empire?3:1.8,0,Math.PI*2); ctx.fill();
        if(b.empire){
          const bg=ctx.createRadialGradient(mx,ty-mastH,0,mx,ty-mastH,22);
          bg.addColorStop(0,'rgba(248,226,49,'+(0.28*bl).toFixed(2)+')'); bg.addColorStop(1,'rgba(248,226,49,0)');
          ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(mx,ty-mastH,22,0,Math.PI*2); ctx.fill();
        }
      }
      // emblem logo on non-central buildings
      if(b.emblem){
        const logo=this._bldgLogo||null;
        if(logo){
          const sz=b.w*0.50, iy=topY+b.h*0.18;
          const glow=0.5+0.3*Math.sin(t*0.3+b.x*0.001);
          ctx.save(); ctx.globalAlpha=0.72+0.18*glow;
          ctx.shadowColor='rgba(248,226,49,1)'; ctx.shadowBlur=Math.round(16*glow);
          ctx.drawImage(logo,mx-sz/2,iy-sz/2,sz,sz);
          ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.restore();
        }
      }
      // sign on central building only
      // sign on central building — one line, gold
      if(b.sign){
        const signY=topY+b.h*0.38;
        const signGlow=0.55+0.45*Math.sin(t*1.4+1.2);
        ctx.save();
        const fsize=Math.max(10,Math.round(b.w*0.19));
        ctx.font='700 '+fsize+'px "Chakra Petch",monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.shadowColor='#F8E231'; ctx.shadowBlur=Math.round(18*signGlow);
        ctx.fillStyle='rgba(248,226,49,'+(0.88+0.12*signGlow).toFixed(2)+')';
        ctx.fillText('6-EMPIRES',mx,signY);
        // underline
        const uw=ctx.measureText('6-EMPIRES').width;
        ctx.strokeStyle='rgba(248,226,49,'+(0.35*signGlow).toFixed(2)+')'; ctx.lineWidth=0.7;
        ctx.beginPath(); ctx.moveTo(mx-uw/2,signY+fsize*0.75); ctx.lineTo(mx+uw/2,signY+fsize*0.75); ctx.stroke();
        ctx.shadowBlur=0; ctx.restore();
      }
    }
  },
  initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow) return;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    const onMove = (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.style.opacity = '1';
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    this._glowMove = onMove;
    const run = () => {
      cx += (tx - cx) * 0.078; cy += (ty - cy) * 0.078;
      glow.style.transform = `translate3d(${cx - 230}px,${cy - 230}px,0)`;
      this._glowRaf = requestAnimationFrame(run);
    };
    this._glowRaf = requestAnimationFrame(run);
  },
  initMagnetic() {
    const targets = document.querySelectorAll(
      '[data-scene="pillars"] [data-reveal],' +
      '[data-scene="spaces"] [data-reveal],' +
      '[data-scene="console"] [data-reveal],' +
      '[data-scene="close"] [data-cta-btn]'
    );
    targets.forEach(el => {
      const isBtn = el.hasAttribute('data-cta-btn');
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width * 0.5)) / (r.width * 0.5);
        const dy = (e.clientY - (r.top + r.height * 0.5)) / (r.height * 0.5);
        el.style.transition = 'transform .12s cubic-bezier(.2,.8,.2,1)';
        if (isBtn) {
          const isPrimary = el.dataset.ctaBtn === 'primary';
          el.style.transform = `translate3d(${dx * 3}px,${-4 + dy}px,0) scale(1.03)`;
          el.style.boxShadow = isPrimary
            ? '0 14px 48px rgba(248,226,49,.55)'
            : '0 0 40px rgba(248,226,49,.28)';
        } else {
          el.style.transform =
            `translate3d(${dx * 5}px,${dy * 4}px,0) perspective(900px) rotateX(${-dy * 3.8}deg) rotateY(${dx * 3.8}deg)`;
        }
      };
      const leave = () => {
        el.style.transition = 'transform .58s cubic-bezier(.2,.8,.2,1),box-shadow .58s';
        el.style.transform = 'translate3d(0,0,0)';
        if (isBtn && el.dataset.ctaBtn === 'outline')
          el.style.boxShadow = '0 0 20px rgba(248,226,49,.08)';
        else if (isBtn) el.style.boxShadow = '';
      };
      el.addEventListener('mousemove', move, { passive: true });
      el.addEventListener('mouseleave', leave, { passive: true });
    });
  },
  initTextScramble() {
    if (!window.IntersectionObserver) return;
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    const scramble = (el) => {
      const orig = el.textContent;
      let frame = 0;
      const q = orig.split('').map((ch, i) => ({
        to: ch,
        start: Math.floor((i / orig.length) * 7),
        end: 11 + Math.floor(Math.random() * 11),
        cur: CHARS[Math.floor(Math.random() * CHARS.length)]
      }));
      const step = () => {
        let out = '', done = 0;
        for (const item of q) {
          if (frame >= item.end) { out += item.to; done++; }
          else if (frame >= item.start) {
            item.cur = CHARS[Math.floor(Math.random() * CHARS.length)];
            out += item.cur;
          } else { out += item.to; }
        }
        el.textContent = out;
        if (done < q.length) { frame++; requestAnimationFrame(step); }
        else { el.textContent = orig; }
      };
      requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const txt = e.target.textContent.trim();
          if (txt.length > 3 && txt.length < 80)
            setTimeout(() => scramble(e.target), 90);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.55 });
    document.querySelectorAll(
      '[data-scene] [style*="letter-spacing:.28em"],' +
      '[data-scene] [style*="letter-spacing:.32em"],' +
      '[data-scene] [style*="letter-spacing:.3em"]'
    ).forEach(el => { if (!el.children.length) obs.observe(el); });
  },
  initAgentCanvas(){
    const canvas = document.getElementById('agentCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let W=0,H=0; const DPR=Math.min(window.devicePixelRatio||1,2);

    const LOBES=[
      {name:'FRONTAL · STRATEGY',  rgb:'248,226,49', cx:0.34,cy:0.38,rx:0.21,ry:0.23,count:26},
      {name:'TEMPORAL · CREATIVE', rgb:'255,165,50',  cx:0.30,cy:0.63,rx:0.17,ry:0.17,count:20},
      {name:'PARIETAL · NEXUS',    rgb:'0,217,255',   cx:0.65,cy:0.38,rx:0.21,ry:0.23,count:24},
      {name:'OCCIPITAL · SENTINEL',rgb:'180,200,220', cx:0.68,cy:0.63,rx:0.16,ry:0.16,count:18},
      {name:'CORTEX CORE',         rgb:'255,252,210', cx:0.50,cy:0.50,rx:0.08,ry:0.09,count:12},
    ];

    let neurons=[],connections=[],signals=[];

    const buildBrain=()=>{
      neurons=[]; connections=[];
      for(const lobe of LOBES){
        for(let i=0;i<lobe.count;i++){
          const ang=Math.random()*Math.PI*2, d=Math.sqrt(Math.random());
          neurons.push({
            x:(lobe.cx+Math.cos(ang)*lobe.rx*d)*W,
            y:(lobe.cy+Math.sin(ang)*lobe.ry*d)*H,
            lobe, potential:0, lastFire:-999,
            vx:(Math.random()-.5)*.07, vy:(Math.random()-.5)*.07
          });
        }
      }
      const cDist=Math.min(W,H)*0.145;
      for(let i=0;i<neurons.length;i++) for(let j=i+1;j<neurons.length;j++){
        const a=neurons[i],b=neurons[j];
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<cDist){
          const same=a.lobe===b.lobe;
          connections.push({a:i,b:j,strength:same?0.12+Math.random()*0.25:0.04+Math.random()*0.12,maxStr:same?1.0:0.65,d});
        }
      }
    };

    const pointer={x:-1,y:-1,active:false,clicked:false};
    const onMove=ev=>{ const r=canvas.getBoundingClientRect(); pointer.x=ev.clientX-r.left; pointer.y=ev.clientY-r.top; pointer.active=true; };
    const onLeave=()=>{ pointer.active=false; };
    const onCanvasClick=ev=>{ const r=canvas.getBoundingClientRect(); pointer.x=ev.clientX-r.left; pointer.y=ev.clientY-r.top; pointer.clicked=true; };
    canvas.addEventListener('mousemove',onMove);
    canvas.addEventListener('mouseleave',onLeave);
    canvas.addEventListener('click',onCanvasClick);
    this._agentMove=onMove; this._agentLeave=onLeave; this._agentClick=onCanvasClick;

    const resize=()=>{ W=canvas.clientWidth; H=canvas.clientHeight; canvas.width=W*DPR; canvas.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); buildBrain(); };
    resize(); this._agentResize=resize; window.addEventListener('resize',resize);

    let frame=0, activeN=0, totalStr=0;
    const step=()=>{
      frame++; const t=frame/60;
      ctx.fillStyle='rgba(5,6,8,.3)'; ctx.fillRect(0,0,W,H);

      // Growth: 0.38 → 1.22 over 110 seconds
      const grow=0.38+Math.min(t/110,1)*0.84;
      const cx=W/2, cy=H/2;

      // Mouse → brain coords
      let mbx=-1,mby=-1;
      if(pointer.active){ mbx=(pointer.x-cx)/grow+cx; mby=(pointer.y-cy)/grow+cy; }

      // Spontaneous firing
      if(frame%42===0){ const i=Math.floor(Math.random()*neurons.length); neurons[i].potential=1.0; }

      // Mouse excites nearby neurons
      if(mbx>0){
        for(const n of neurons){ if(Math.hypot(n.x-mbx,n.y-mby)<Math.min(W,H)*0.11) n.potential=Math.min(1,n.potential+0.07); }
      }

      // Click cascade
      if(pointer.clicked){
        pointer.clicked=false;
        const ox=mbx>0?mbx:cx, oy=mby>0?mby:cy;
        for(const n of neurons){
          const d=Math.hypot(n.x-ox,n.y-oy), r=Math.min(W,H)*0.30;
          if(d<r) n.potential=Math.max(n.potential, 0.85-d/r*0.5);
        }
      }

      // Update neurons
      activeN=0; totalStr=0;
      for(let i=0;i<neurons.length;i++){
        const n=neurons[i];
        if(n.potential>0.72 && frame-n.lastFire>28){
          n.lastFire=frame;
          for(const c of connections){
            if(c.a===i||c.b===i){
              signals.push({ai:c.a===i?i:c.b, bi:c.a===i?c.b:c.a, p:0, c});
              c.strength=Math.min(c.maxStr,c.strength+0.009);
            }
          }
        }
        n.potential*=0.93;
        if(n.potential>0.08) activeN++;
        // Drift + spring back to lobe center
        n.x+=n.vx; n.y+=n.vy;
        const tx=n.lobe.cx*W, ty=n.lobe.cy*H;
        n.vx+=(tx-n.x)*0.00035; n.vy+=(ty-n.y)*0.00035;
        n.vx*=0.972; n.vy*=0.972;
      }
      for(const c of connections){ totalStr+=c.strength; c.strength=Math.max(0.02,c.strength-0.00008); }

      // === DRAW (scaled brain) ===
      ctx.save(); ctx.translate(cx,cy); ctx.scale(grow,grow); ctx.translate(-cx,-cy);

      // Pulsing brain aura
      const pulse=0.5+0.5*Math.sin(t*1.8);
      const aura=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(W,H)*0.44);
      aura.addColorStop(0,`rgba(248,226,49,${(0.03+0.03*pulse).toFixed(3)})`);
      aura.addColorStop(0.6,`rgba(248,226,49,${(0.015).toFixed(3)})`);
      aura.addColorStop(1,'rgba(248,226,49,0)');
      ctx.fillStyle=aura; ctx.beginPath(); ctx.ellipse(cx,cy,Math.min(W,H)*0.44,Math.min(W,H)*0.38,0,0,Math.PI*2); ctx.fill();

      // Lobe glow halos
      for(const lobe of LOBES){
        const lx=lobe.cx*W, ly=lobe.cy*H, lr=Math.min(W,H)*(lobe.rx+lobe.ry)*0.55;
        const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,lr);
        lg.addColorStop(0,`rgba(${lobe.rgb},0.05)`); lg.addColorStop(1,`rgba(${lobe.rgb},0)`);
        ctx.fillStyle=lg; ctx.beginPath(); ctx.ellipse(lx,ly,lr,lr*0.85,0,0,Math.PI*2); ctx.fill();
      }

      // Connections
      for(const c of connections){
        if(c.strength<0.05) continue;
        const a=neurons[c.a], b=neurons[c.b];
        const al=Math.min(0.55,c.strength*0.52);
        const rgb=a.lobe===b.lobe?a.lobe.rgb:'210,195,120';
        ctx.strokeStyle=`rgba(${rgb},${al.toFixed(3)})`; ctx.lineWidth=c.strength*2.4;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      }

      // Signals (action potentials)
      for(let i=signals.length-1;i>=0;i--){
        const s=signals[i]; s.p+=0.052;
        if(s.p>=1){ signals.splice(i,1); continue; }
        const ease=s.p<0.5?2*s.p*s.p:1-Math.pow(-2*s.p+2,2)/2;
        const a=neurons[s.ai],b=neurons[s.bi];
        const sx=a.x+(b.x-a.x)*ease, sy=a.y+(b.y-a.y)*ease;
        const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,9);
        sg.addColorStop(0,'rgba(255,255,255,.95)'); sg.addColorStop(0.4,`rgba(${a.lobe.rgb},.6)`); sg.addColorStop(1,`rgba(${a.lobe.rgb},0)`);
        ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(sx,sy,9,0,Math.PI*2); ctx.fill();
      }

      // Neurons
      for(const n of neurons){
        const base=n.potential>0.1?n.potential:0.18+0.1*Math.sin(t*1.3+n.x*0.01);
        const r=2.2+base*4.0, al=0.25+base*0.75;
        const gg=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*5.5);
        gg.addColorStop(0,`rgba(${n.lobe.rgb},${(al*0.42).toFixed(3)})`); gg.addColorStop(1,`rgba(${n.lobe.rgb},0)`);
        ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(n.x,n.y,r*5.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(${n.lobe.rgb},${al.toFixed(3)})`; ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fill();
        if(n.potential>0.7){ ctx.fillStyle='rgba(255,255,255,.88)'; ctx.beginPath(); ctx.arc(n.x,n.y,r*0.45,0,Math.PI*2); ctx.fill(); }
      }

      ctx.restore();

      // Lobe labels (screen space — scale-corrected position)
      ctx.font='bold 9.5px Space Mono,monospace'; ctx.textAlign='center';
      for(const lobe of LOBES){
        if(lobe.name==='CORTEX CORE') continue;
        const sx=(lobe.cx*W-cx)*grow+cx;
        const sy=(lobe.cy*H-cy)*grow+cy+Math.min(W,H)*(lobe.ry*grow+0.07);
        ctx.fillStyle=`rgba(${lobe.rgb},0.72)`; ctx.fillText(lobe.name,sx,sy);
      }

      // Status HUD
      const learnPct=Math.min(100,Math.round(totalStr/(connections.length||1)*100));
      const growPct=Math.round((grow-0.38)/0.84*100);
      ctx.fillStyle='rgba(248,226,49,.62)'; ctx.font='10px Space Mono,monospace'; ctx.textAlign='left';
      ctx.fillText('NEURONS ACTIVE   '+activeN+' / '+neurons.length, 20, H-56);
      ctx.fillText('STRONG SYNAPSES  '+connections.filter(c=>c.strength>0.32).length, 20, H-40);
      ctx.fillText('LEARNING INDEX   '+learnPct+'%', 20, H-24);
      ctx.fillText('GROWTH FACTOR    '+growPct+'%  ·  T+'+Math.floor(t)+'s', 20, H-8);

      this._agentRaf=requestAnimationFrame(step);
    };
    this._agentRaf=requestAnimationFrame(step);
  },
  initCityAudio(){
    // Real city night ambient sound via HTML5 Audio
    const audio = new Audio();
    audio.src = 'https://cdn.pixabay.com/audio/2022/02/09/audio_c33fe07abe.mp3';
    audio.loop = true;
    audio.volume = 0.22;
    audio.preload = 'none';
    this._cityAudio = audio;
    let started = false;
    const btn = document.getElementById('cityAudioBtn');
    const startAudio = () => {
      if(started) return; started = true;
      audio.play().catch(()=>{});
      if(btn){ btn.style.opacity='1'; btn.innerHTML='🔊'; }
    };
    document.addEventListener('click', e => { if(e.target!==btn) startAudio(); }, {once:true});
    document.addEventListener('keydown', startAudio, {once:true});
    document.addEventListener('touchstart', startAudio, {once:true});
    if(btn){
      btn.addEventListener('click', e => {
        e.stopPropagation();
        startAudio();
        const muted = btn.dataset.muted === '1';
        audio.muted = !muted;
        btn.dataset.muted = muted ? '0' : '1';
        btn.innerHTML = muted ? '🔊' : '🔇';
      });
    }
  },
  initMeshPyramid(){
    const canvas=document.getElementById('meshPyramid'); if(!canvas) return;
    const DPR=Math.min(window.devicePixelRatio||1,2);
    const resize=()=>{ canvas.width=canvas.clientWidth*DPR; canvas.height=canvas.clientHeight*DPR; };
    resize(); window.addEventListener('resize',resize);
    const ctx=canvas.getContext('2d');
    let f=0;
    const draw=()=>{
      f++; const t=f/60;
      const W=canvas.width/DPR, H=canvas.height/DPR;
      ctx.setTransform(DPR,0,0,DPR,0,0);
      ctx.clearRect(0,0,W,H);
      const cx=W/2, cy=H*0.88;
      const apx=W/2, apy=H*0.06;
      const bl=[W*0.04,cy], br=[W*0.96,cy];
      const pulse=0.55+0.45*Math.sin(t*1.2);
      const slowPulse=0.6+0.4*Math.sin(t*0.5);
      // outer glow halo around apex
      const halo=ctx.createRadialGradient(apx,apy,0,apx,apy,H*0.55);
      halo.addColorStop(0,'rgba(248,226,49,'+(0.22*pulse).toFixed(3)+')');
      halo.addColorStop(0.4,'rgba(248,226,49,'+(0.08*pulse).toFixed(3)+')');
      halo.addColorStop(1,'rgba(248,226,49,0)');
      ctx.fillStyle=halo; ctx.fillRect(0,0,W,H);
      // scan lines (horizontal rays from apex)
      for(let i=1;i<=4;i++){
        const iy=apy+i*(cy-apy)/5;
        const spread=((iy-apy)/(cy-apy))*(W*0.46);
        ctx.strokeStyle='rgba(248,226,49,'+(0.04+0.03*Math.sin(t*2+i)).toFixed(3)+')';
        ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(cx-spread,iy); ctx.lineTo(cx+spread,iy); ctx.stroke();
      }
      // inner filled faces
      ctx.fillStyle='rgba(248,226,49,'+(0.05*slowPulse).toFixed(3)+')';
      ctx.beginPath(); ctx.moveTo(apx,apy); ctx.lineTo(cx,cy); ctx.lineTo(...br); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(248,226,49,'+(0.10*slowPulse).toFixed(3)+')';
      ctx.beginPath(); ctx.moveTo(apx,apy); ctx.lineTo(...bl); ctx.lineTo(cx,cy); ctx.closePath(); ctx.fill();
      // outer triangle
      ctx.strokeStyle='rgba(248,226,49,'+(0.55+0.35*pulse).toFixed(3)+')';
      ctx.lineWidth=1.5;
      ctx.shadowColor='#F8E231'; ctx.shadowBlur=8*pulse;
      ctx.beginPath(); ctx.moveTo(apx,apy); ctx.lineTo(...bl); ctx.lineTo(...br); ctx.closePath(); ctx.stroke();
      ctx.shadowBlur=0;
      // inner triangles
      for(let n=1;n<=2;n++){
        const f2=n/3;
        const ix1=apx+(bl[0]-apx)*f2, iy1=apy+(cy-apy)*f2;
        const ix2=apx+(br[0]-apx)*f2, iy2=apy+(cy-apy)*f2;
        const ibl=[apx+(bl[0]-apx)*f2+((bl[0]-cx)*f2),cy*f2+apy*(1-f2)]; 
        ctx.strokeStyle='rgba(248,226,49,'+(0.3+0.2*Math.sin(t*1.5+n)).toFixed(3)+')';
        ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(apx+(bl[0]-apx)*(f2*0.5+0.15),apy+(cy-apy)*(f2*0.5+0.15));
        const lx1=bl[0]+(apx-bl[0])*(1-f2), ly1=cy;
        const lx2=br[0]+(apx-br[0])*(1-f2), ly2=cy;
        ctx.moveTo(apx,apy+(cy-apy)*n/3); ctx.lineTo(lx1,ly1); ctx.lineTo(lx2,ly2); ctx.closePath(); ctx.stroke();
      }
      // apex dot glow
      const apexGlow=ctx.createRadialGradient(apx,apy,0,apx,apy,14);
      apexGlow.addColorStop(0,'rgba(255,255,220,'+(0.9+0.1*pulse).toFixed(2)+')');
      apexGlow.addColorStop(0.4,'rgba(248,226,49,'+(0.7*pulse).toFixed(2)+')');
      apexGlow.addColorStop(1,'rgba(248,226,49,0)');
      ctx.fillStyle=apexGlow; ctx.beginPath(); ctx.arc(apx,apy,14,0,Math.PI*2); ctx.fill();
      // corner dots
      [[bl[0],cy],[br[0],cy]].forEach(([px,py])=>{
        const dg=ctx.createRadialGradient(px,py,0,px,py,6);
        dg.addColorStop(0,'rgba(248,226,49,'+(0.7*pulse).toFixed(2)+')');
        dg.addColorStop(1,'rgba(248,226,49,0)');
        ctx.fillStyle=dg; ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); ctx.fill();
      });
      // center hypnotic spiral (no eye)
      const eyeCx=cx, eyeCy=apy+(cy-apy)*0.52;
      const spirals=3;
      for(let s=0;s<spirals;s++){
        const sph=s*(Math.PI*2/spirals);
        for(let ring=1;ring<=5;ring++){
          const rr=ring*H*0.08, phase=t*0.25*(ring%2===0?1:-1)+sph;
          ctx.strokeStyle='rgba(248,226,49,'+(0.04+0.06*(1-ring/6)+0.04*Math.sin(t*1.2+ring)).toFixed(3)+')';
          ctx.lineWidth=0.9;
          ctx.beginPath();
          for(let a=0;a<=Math.PI*2;a+=0.06){
            const rx=eyeCx+Math.cos(a+phase)*rr;
            const ry=eyeCy+Math.sin(a+phase)*rr*(0.32+0.12*Math.sin(t*0.5+ring+s));
            a===0?ctx.moveTo(rx,ry):ctx.lineTo(rx,ry);
          }
          ctx.closePath(); ctx.stroke();
        }
      }
      // bright center dot
      const cDot=ctx.createRadialGradient(eyeCx,eyeCy,0,eyeCx,eyeCy,6);
      cDot.addColorStop(0,'rgba(255,255,200,'+(0.8+0.2*pulse).toFixed(2)+')');
      cDot.addColorStop(1,'rgba(248,226,49,0)');
      ctx.fillStyle=cDot; ctx.beginPath(); ctx.arc(eyeCx,eyeCy,6,0,Math.PI*2); ctx.fill();
      // pulsing emission rings from apex
      for(let r=0;r<3;r++){
        const rph=(t*0.8+r)%2.4, rp=rph/2.4;
        const rr=rp*H*0.55, al=(1-rp)*0.25*pulse;
        ctx.strokeStyle='rgba(248,226,49,'+al.toFixed(3)+')'; ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.arc(apx,apy,rr,0,Math.PI*2); ctx.stroke();
      }
      this._meshPyramidRaf=requestAnimationFrame(draw);
    };
    this._meshPyramidRaf=requestAnimationFrame(draw);
  },
  initTradingChart(){
    const canvas=document.getElementById('tradingChart'); if(!canvas) return;
    const DPR=Math.min(window.devicePixelRatio||1,2);
    const resize=()=>{ canvas.width=canvas.clientWidth*DPR; canvas.height=canvas.clientHeight*DPR; };
    resize();
    // generate candlestick data
    const bars=32; let price=100;
    const data=Array.from({length:bars},()=>{
      const o=price, change=(Math.random()-.47)*4;
      const h=o+Math.random()*3, l=o-Math.random()*3;
      const c=o+change; price=c;
      return {o,h,l,c};
    });
    const priceStream=()=>{
      const last=data[data.length-1];
      const change=(Math.random()-.47)*2.5;
      const c=last.c+change;
      data.push({o:last.c,h:Math.max(last.c,c)+Math.random()*1.5,l:Math.min(last.c,c)-Math.random()*1.5,c});
      if(data.length>bars) data.shift();
    };
    setInterval(priceStream,600);
    const draw=()=>{
      const W=canvas.width/DPR, H=canvas.height/DPR;
      const ctx=canvas.getContext('2d');
      ctx.setTransform(DPR,0,0,DPR,0,0);
      ctx.clearRect(0,0,W,H);
      const min=Math.min(...data.map(d=>d.l)), max=Math.max(...data.map(d=>d.h));
      const range=max-min||1;
      const bw=Math.floor(W/bars)-1;
      const toY=v=>H-(v-min)/range*H*0.88-H*0.06;
      // line
      ctx.beginPath();
      data.forEach((d,i)=>{ const x=i*(bw+1)+bw/2; i===0?ctx.moveTo(x,toY(d.c)):ctx.lineTo(x,toY(d.c)); });
      ctx.strokeStyle='rgba(248,226,49,0.4)'; ctx.lineWidth=0.8; ctx.stroke();
      // candles
      data.forEach((d,i)=>{
        const x=i*(bw+1), bull=d.c>=d.o;
        const col=bull?'rgba(80,220,100,0.85)':'rgba(220,60,60,0.85)';
        // wick
        ctx.strokeStyle=col; ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(x+bw/2,toY(d.h)); ctx.lineTo(x+bw/2,toY(d.l)); ctx.stroke();
        // body
        const top=toY(Math.max(d.o,d.c)), bot=toY(Math.min(d.o,d.c)), bh=Math.max(1,bot-top);
        ctx.fillStyle=col; ctx.fillRect(x,top,bw,bh);
      });
      // last price label
      const last=data[data.length-1];
      ctx.font='bold 9px monospace'; ctx.fillStyle='#F8E231';
      ctx.textAlign='right'; ctx.fillText(last.c.toFixed(2),W-2,10);
      this._tradingChartRaf=requestAnimationFrame(draw);
    };
    this._tradingChartRaf=requestAnimationFrame(draw);
  },
  toggleTower(){
    this._towerOpen = !this._towerOpen;
    const open = this._towerOpen;
    const front = document.querySelector('[data-tower-front]');
    const floors = document.querySelector('[data-floors]');
    const hint = document.querySelector('[data-hint-text]');
    if(front) front.style.opacity = open ? '0.08' : '1';
    if(floors){ floors.style.opacity = open ? '1' : '0'; }
    if(hint) hint.textContent = open ? 'EXIT · CLOSE CUTAWAY' : 'CLICK TOWER · ENTER HQ';
  },
  componentDidMount(){
    this.initCityAudio();
    this.initManhattanBg();
    this.initBgMesh();
    this.initAgentCanvas();
    this.initMeshPyramid();
    this.initTradingChart();
    this.onScroll = this.onScroll.bind(this);
    window.addEventListener('scroll', this.onScroll, {passive:true});
    window.addEventListener('resize', this.onScroll, {passive:true});
    // build left tick rail
    const ticks = document.querySelector('[data-six-ticks]');
    if(ticks){ let h=''; for(let i=0;i<11;i++){ const on=i%5===0; h += '<div style="display:flex;align-items:center;gap:6px;"><span style="width:'+(on?14:7)+'px;height:1px;background:rgba(248,226,49,'+(on?'.7':'.3')+')"></span>'+(on?'<span>'+String(i*10).padStart(3,'0')+'</span>':'')+'</div>'; } ticks.innerHTML=h; }
    this.raf = requestAnimationFrame(()=>this.onScroll());
    /* boot new systems after first paint */
    this.initCursorGlow();
    this.initMagnetic();
    setTimeout(() => this.initTextScramble(), 600);
  }
};
(function(){
  if(!SIX2.componentDidMount) return;
  SIX2.componentDidMount();
})();
