#!/usr/bin/env python3
import re
body   = open("./_body.html",encoding="utf-8").read()
styles = open("./_styles.css",encoding="utf-8").read()
build  = open("./_build.js",encoding="utf-8").read()
draw   = open("./_draw.js",encoding="utf-8").read()
try:
    enhancements = open("./_enhancements.js",encoding="utf-8").read()
except FileNotFoundError:
    enhancements = ""

# turn the class methods into standalone functions operating on a shared state object S
# _buildManhattan(canvas){...}  -> function buildManhattan(canvas){...}
build = re.sub(r'^\s*_buildManhattan\s*\(', 'function buildManhattan(', build)
draw  = re.sub(r'^\s*_drawManhattan\s*\(',  'function drawManhattan(',  draw)
# replace this._mX  ->  S.mX
for fn in ('build','draw'):
    pass
build = re.sub(r'this\._m', 'S.m', build)
draw  = re.sub(r'this\._m', 'S.m', draw)

canvas_js = f"""
var S = {{}};
{build}
{draw}
(function(){{
  var canvas = document.getElementById('manhattanBg');
  if(!canvas) return;
  function resize(){{ canvas.width = window.innerWidth; canvas.height = window.innerHeight; buildManhattan(canvas); }}
  window.addEventListener('resize', resize); resize();
  function loop(ts){{ drawManhattan(ts); requestAnimationFrame(loop); }}
  requestAnimationFrame(loop);
}})();
"""

reveal_js = """
(function(){
  // scroll reveal
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        var el=e.target;
        el.style.opacity='1';
        el.style.transform='none';
      }
    });
  }, {threshold:0.12});
  document.querySelectorAll('[data-reveal]').forEach(function(el){ io.observe(el); });

  // HUD: progress rail + tick rail + phase + coords
  var prog = document.querySelector('[data-six-progress]');
  var phaseEl = document.querySelector('[data-six-phase]');
  var coordEl = document.querySelector('[data-six-coords]');
  var ticks = document.querySelector('[data-six-ticks]');
  if(ticks){ var h=''; for(var i=0;i<9;i++){h+='<span>'+String(i).padStart(2,'0')+'</span>';} ticks.innerHTML=h; }
  var scenes = [].slice.call(document.querySelectorAll('[data-scene]'));
  function onScroll(){
    var sc = window.scrollY, dh = document.body.scrollHeight - window.innerHeight;
    var pct = dh>0 ? (sc/dh*100) : 0;
    if(prog) prog.style.height = pct.toFixed(1)+'%';
    // active scene label
    var mid = sc + window.innerHeight*0.5, cur=scenes[0];
    scenes.forEach(function(s){ if(s.offsetTop<=mid) cur=s; });
    if(cur){
      if(phaseEl) phaseEl.textContent='PHASE // '+ (cur.getAttribute('data-screen-label')||'').toUpperCase();
    }
    if(coordEl){
      var alt = Math.round(pct*36);
      coordEl.textContent='LAT 06.660 // LON −06.066 // ALT '+String(alt).padStart(4,'0')+'m';
    }
    // depth parallax
    document.querySelectorAll('[data-depth]').forEach(function(el){
      var d = parseFloat(el.getAttribute('data-depth'))||0;
      var r = el.getBoundingClientRect();
      var off = (r.top + r.height/2 - window.innerHeight/2);
      el.style.transform = (el.dataset._base||'') + ' translateY(' + (off * d * -0.02).toFixed(1) + 'px)';
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();
"""

INDEX = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>6-EMPIRES — Sovereign AI-Powered Corporation</title>
<meta name="description" content="6-EMPIRES — Decentralized intelligence. Autonomous innovation. Sovereign by design." />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Sora:wght@200;300;400;500;600&display=swap" rel="stylesheet">
<style>
html,body{{background:#030508;margin:0;padding:0;}}
{styles}
</style>
</head>
<body>
<canvas id="manhattanBg" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;"></canvas>
{body}
<script>{canvas_js}</script>
<script>{reveal_js}</script>
<script>{enhancements}</script>
</body>
</html>
"""
open("./index.html","w",encoding="utf-8").write(INDEX)
print("index.html written:", len(INDEX), "bytes")
