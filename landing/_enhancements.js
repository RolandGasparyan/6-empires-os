
var SIX2 = {
  initBgMesh(){
    const canvas=document.getElementById('bgMesh'); if(!canvas) return;
    const ctx=canvas.getContext('2d');
    let W=0,H=0; const DPR=Math.min(window.devicePixelRatio||1,2);
    let nodes=[], sky=[];
    const seedNodes=()=>{ nodes=[]; const n=Math.max(24,Math.min(50,Math.floor((W*H)/44000)));
      for(let i=0;i<n;i++) nodes.push({x:Math.random()*W,y:Math.random()*H*0.78,vx:(Math.random()-.5)*.09,vy:(Math.random()-.5)*.09,r:Math.random()*1.7+1.0,ph:Math.random()*6.28}); };
    const buildSkyline=()=>{
      sky=[];
      const defs=[
        {cx:0.07,w:0.06,h:0.16},{cx:0.15,w:0.05,h:0.12},{cx:0.24,w:0.06,h:0.23},{cx:0.33,w:0.045,h:0.15},
        {cx:0.50,w:0.085,h:0.46,empire:true},
        {cx:0.64,w:0.05,h:0.17},{cx:0.72,w:0.07,h:0.27},{cx:0.81,w:0.05,h:0.15},{cx:0.90,w:0.06,h:0.21},{cx:0.97,w:0.05,h:0.13}
      ];
      for(const d of defs){
        const w=d.w*W, x=d.cx*W - w/2, h=d.h*H;
        const cols=Math.max(2,Math.floor(w/14)), rows=Math.max(2,Math.floor(h/18)), wins=[];
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ if(Math.random()<0.45) wins.push({c,r,ph:Math.random()*6.28,sp:0.4+Math.random()*1.1}); }
        sky.push({x,w,h,empire:!!d.empire,cols,rows,wins});
      }
    };
    const resize=()=>{ W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0); seedNodes(); buildSkyline(); };
    resize(); this._bgResize=resize; window.addEventListener('resize',resize);
    let f=0;
    const draw=()=>{
      f++; const t=f/60;
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      // radar arcs (lower-left)
      const ax=-W*0.03, ay=H*0.5;
      for(let i=1;i<=8;i++){ const rad=i*Math.min(W,H)*0.08 + Math.sin(t*0.25+i)*4;
        ctx.strokeStyle='rgba(248,226,49,'+Math.max(0,0.055-i*0.005).toFixed(3)+')'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(ax,ay,rad,-0.35,1.7); ctx.stroke(); }
      // drifting constellation mesh
      for(const p of nodes){ p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x+=W; else if(p.x>W)p.x-=W;
        const yb=H*0.78; if(p.y<0)p.y+=yb; else if(p.y>yb)p.y-=yb; }
      for(let i=0;i<nodes.length;i++){ const a=nodes[i];
        for(let j=i+1;j<nodes.length;j++){ const b=nodes[j]; const dx=a.x-b.x,dy=a.y-b.y;
          if(dx>190||dx<-190||dy>190||dy<-190) continue; const d=Math.hypot(dx,dy);
          if(d<190){ const al=(1-d/190)*0.15; ctx.strokeStyle='rgba(212,186,40,'+al.toFixed(3)+')'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } }
      for(const p of nodes){ const tw=0.5+0.5*Math.sin(t*1.1+p.ph);
        ctx.fillStyle='rgba(248,226,49,'+(0.35+0.5*tw).toFixed(3)+')';
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.2832); ctx.fill(); }
      // Empire State skyline
      this.drawSkyline(ctx,W,H,sky,t);
      this._bgRaf=requestAnimationFrame(draw);
    };
    this._bgRaf=requestAnimationFrame(draw);
  },
  drawSkyline(ctx,W,H,sky,t){
    for(const b of sky){
      const topY=H-b.h;
      const g=ctx.createLinearGradient(0,topY,0,H);
      g.addColorStop(0,'rgba(17,18,23,0.97)'); g.addColorStop(1,'rgba(6,7,9,0.99)');
      ctx.fillStyle=g; ctx.fillRect(b.x,topY,b.w,b.h);
      // top + side rim glow
      ctx.strokeStyle='rgba(248,226,49,0.30)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(b.x,topY); ctx.lineTo(b.x+b.w,topY); ctx.stroke();
      ctx.strokeStyle='rgba(248,226,49,0.09)';
      ctx.beginPath(); ctx.moveTo(b.x,topY); ctx.lineTo(b.x,H); ctx.moveTo(b.x+b.w,topY); ctx.lineTo(b.x+b.w,H); ctx.stroke();
      // windows
      const cw=b.w/b.cols, rh=18;
      for(const w of b.wins){ const wx=b.x+w.c*cw+cw*0.28, wy=topY+9+w.r*rh; if(wy>H-4) continue;
        const lit=0.18+0.5*(0.5+0.5*Math.sin(t*w.sp+w.ph));
        ctx.fillStyle='rgba(248,226,49,'+lit.toFixed(3)+')';
        ctx.fillRect(wx,wy,Math.max(2,cw*0.32),3); }
      if(b.empire){
        // stepped art-deco crown
        let ty=topY;
        const tiers=[[0.72,20],[0.48,18],[0.30,18]];
        for(const tr of tiers){ const ntw=b.w*tr[0], th=tr[1], ntx=b.x+(b.w-ntw)/2;
          ctx.fillStyle='rgba(21,22,27,0.98)'; ctx.fillRect(ntx,ty-th,ntw,th);
          ctx.strokeStyle='rgba(248,226,49,0.4)'; ctx.lineWidth=1; ctx.strokeRect(ntx+0.5,ty-th+0.5,ntw-1,th-1);
          ty-=th; }
        // antenna mast
        const mx=b.x+b.w/2, mastH=b.h*0.20;
        const mg=ctx.createLinearGradient(0,ty-mastH,0,ty);
        mg.addColorStop(0,'rgba(248,226,49,0)'); mg.addColorStop(1,'rgba(248,226,49,0.75)');
        ctx.strokeStyle=mg; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(mx,ty); ctx.lineTo(mx,ty-mastH); ctx.stroke();
        // blinking beacon
        const bl=0.5+0.5*Math.sin(t*3);
        const bg=ctx.createRadialGradient(mx,ty-mastH,0,mx,ty-mastH,18);
        bg.addColorStop(0,'rgba(248,226,49,'+(0.3*bl).toFixed(3)+')'); bg.addColorStop(1,'rgba(248,226,49,0)');
        ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(mx,ty-mastH,18,0,6.2832); ctx.fill();
        ctx.fillStyle='rgba(248,226,49,'+(0.55+0.45*bl).toFixed(3)+')';
        ctx.beginPath(); ctx.arc(mx,ty-mastH,2.4+bl*1.3,0,6.2832); ctx.fill();
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
  }
};
function openAdminLogin() {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(3,4,7,.96);backdrop-filter:blur(18px);display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
          <div style="position:relative;width:100%;max-width:400px;padding:48px 40px;background:linear-gradient(160deg,#0d1118,#070a0e);border:1px solid rgba(248,226,49,.35);box-shadow:0 0 80px rgba(248,226,49,.08);">
            <div style="position:absolute;top:0;left:0;width:18px;height:18px;border-top:1.5px solid #F8E231;border-left:1.5px solid #F8E231;"></div>
            <div style="position:absolute;top:0;right:0;width:18px;height:18px;border-top:1.5px solid #F8E231;border-right:1.5px solid #F8E231;"></div>
            <div style="position:absolute;bottom:0;left:0;width:18px;height:18px;border-bottom:1.5px solid #F8E231;border-left:1.5px solid #F8E231;"></div>
            <div style="position:absolute;bottom:0;right:0;width:18px;height:18px;border-bottom:1.5px solid #F8E231;border-right:1.5px solid #F8E231;"></div>
            <div style="text-align:center;margin-bottom:36px;">
              <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.28em;color:rgba(248,226,49,.5);margin-bottom:10px;">SOVEREIGN ACCESS</div>
              <div style="font-family:'Chakra Petch',sans-serif;font-weight:700;font-size:22px;letter-spacing:.1em;color:#F4F5F7;">ADMIN LOGIN</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div>
                <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.18em;color:rgba(248,226,49,.5);margin-bottom:6px;">IDENTIFIER</div>
                <input id="adminUser" type="text" placeholder="founder@6-empires.com" autocomplete="off" style="width:100%;padding:12px 14px;background:rgba(248,226,49,.04);border:1px solid rgba(248,226,49,.25);color:#F4F5F7;font-family:'Chakra Petch',sans-serif;font-size:13px;letter-spacing:.04em;outline:none;box-sizing:border-box;">
              </div>
              <div>
                <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.18em;color:rgba(248,226,49,.5);margin-bottom:6px;">PASSKEY</div>
                <input id="adminPass" type="password" placeholder="••••••••••••" style="width:100%;padding:12px 14px;background:rgba(248,226,49,.04);border:1px solid rgba(248,226,49,.25);color:#F4F5F7;font-family:'Chakra Petch',sans-serif;font-size:13px;letter-spacing:.08em;outline:none;box-sizing:border-box;">
              </div>
              <button id="adminSubmit" style="margin-top:8px;width:100%;padding:14px;background:#F8E231;border:none;cursor:pointer;font-family:'Chakra Petch',sans-serif;font-weight:700;font-size:13px;letter-spacing:.14em;color:#050608;transition:transform .18s,box-shadow .18s;">AUTHENTICATE →</button>
              <div id="adminErr" style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.12em;color:rgba(220,60,60,.8);text-align:center;min-height:14px;"></div>
            </div>
            <button id="adminClose" style="position:absolute;top:14px;right:14px;background:none;border:none;color:rgba(248,226,49,.4);font-size:18px;cursor:pointer;line-height:1;padding:4px;">✕</button>
          </div>`;
        document.body.appendChild(overlay);
        const close = () => document.body.removeChild(overlay);
        document.getElementById('adminClose').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.getElementById('adminSubmit').addEventListener('mouseenter', e => { e.target.style.transform='translateY(-2px)';e.target.style.boxShadow='0 8px 28px rgba(248,226,49,.45)'; });
        document.getElementById('adminSubmit').addEventListener('mouseleave', e => { e.target.style.transform='';e.target.style.boxShadow=''; });
        document.getElementById('adminSubmit').addEventListener('click', () => {
          const u = document.getElementById('adminUser').value.trim();
          const pw = document.getElementById('adminPass').value;
          const err = document.getElementById('adminErr');
          if (!u || !pw) { err.textContent = 'ALL FIELDS REQUIRED'; return; }
          err.style.color = 'rgba(248,226,49,.6)';
          err.textContent = 'AUTHENTICATING…';
          setTimeout(() => {
            err.style.color = 'rgba(220,60,60,.8)';
            err.textContent = 'ACCESS RESTRICTED — CONTACT ROLAND G.';
          }, 1400);
        });
        setTimeout(() => document.getElementById('adminUser').focus(), 100);
      }
(function(){
  if(!SIX2.initBgMesh) return;
  SIX2.initBgMesh();
  SIX2.initCursorGlow();
  SIX2.initMagnetic();
  setTimeout(function(){ SIX2.initTextScramble(); }, 600);
})();
