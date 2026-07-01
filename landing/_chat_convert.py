#!/usr/bin/env python3
"""Convert 6-EMPIRES-Chat.dc.html -> standalone chat.html wired to the real EMPIRE brain + voice."""
import re

src = open("./_chat_source.dc.html", encoding="utf-8").read()

# 1) styles from helmet
styles = ''.join(re.findall(r'<style>(.*?)</style>', src, flags=re.S))

# 2) body: the first top-level <div style="display:flex;flex-direction:column;height:100vh ...> ... up to </x-dc>
m = re.search(r'(<div style="display:flex;flex-direction:column;height:100vh.*?)</x-dc>', src, re.S)
body = m.group(1)

# 3) resolve {{ handler }} bindings -> real function names
binds = {
    '{{ toggleModelMenu }}': 'toggleModelMenu()',
    '{{ setModel }}': 'setModel(this)',
    '{{ setMode }}': 'setMode(this)',
    '{{ toggleProjects }}': 'toggleProjects()',
    '{{ sendMessage }}': 'sendMessage()',
    '{{ handleKey }}': 'handleKey(event)',
    '{{ handleUpload }}': 'handleUpload(this)',
}
for k, v in binds.items():
    body = body.replace('onClick="%s"' % k, 'onclick="%s"' % v)
    body = body.replace('onKeyDown="%s"' % k, 'onkeydown="%s"' % v)
    body = body.replace('onChange="%s"' % k, 'onchange="%s"' % v)
    body = body.replace(k, v)

# 4) emblem -> gold logo
body = body.replace('6-empires-emblem.png', 'empire-logo.png')
# remove the white-ish brightness boosts that wash gold; keep glow
body = body.replace('brightness(1.1)', '')
body = body.replace('brightness(1.3)', '')

# strip leftover comment anchors / hint attrs
body = re.sub(r'\sdata-comment-anchor="[^"]*"', '', body)

# 5) the REAL app script (replaces the demo DCLogic). Streams from /chat/api/chat + voice.
app_js = r"""
const BASE=(location.pathname.replace(/\/[^/]*$/,'')+'/').replace(/\/+$/,'/');
const api=(p)=>BASE.replace(/\/$/,'')+p;
let MODEL='empire-prime', MODE='empire', speakOn=false, history=[];
const MODELMAP={PRIME:'empire-prime',MEDIA:'empire-media',NEXUS:'empire-research'};
const MODEMAP={'EMPIRE CORE':'empire','RAPID FIRE':'empire','DEEP RESEARCH':'academic','CREATIVE':'builder'};

function toggleModelMenu(){const m=document.getElementById('modelMenu');if(!m)return;
  m.style.display=m.style.display==='block'?'none':'block';
  if(m.style.display==='block'){setTimeout(()=>{const c=(e)=>{if(!m.contains(e.target)){m.style.display='none';document.removeEventListener('click',c);}};document.addEventListener('click',c);},50);}}
function setModel(btn){const k=btn.getAttribute('data-model');MODEL=MODELMAP[k]||'empire-prime';
  const l=document.getElementById('activeModelLabel');if(l)l.textContent=k;
  document.querySelectorAll('#modelMenu [data-model]').forEach(b=>{const a=b.getAttribute('data-model')===k;b.style.color=a?'#FDC72C':'rgba(253,199,44,.45)';const d=b.querySelector('div');if(d)d.style.background=a?'#FDC72C':'rgba(253,199,44,.3)';});
  document.getElementById('modelMenu').style.display='none';}
function setMode(btn){const k=btn.getAttribute('data-mode');MODE=MODEMAP[k]||'empire';
  document.querySelectorAll('[data-mode]').forEach(b=>{const a=b.getAttribute('data-mode')===k;b.style.background=a?'rgba(253,199,44,.08)':'none';b.style.color=a?'#FDC72C':'rgba(253,199,44,.45)';});
  const m=document.getElementById('modelMenu');if(m)m.style.display='none';}
function toggleProjects(){const p=document.getElementById('projectsPanel');if(!p)return;p.style.display=p.style.display==='flex'?'none':'flex';}
function handleUpload(inp){const f=inp.files&&inp.files[0];if(!f)return;const i=document.getElementById('chatInput');if(i){i.value='[Attached: '+f.name+'] ';i.focus();}}
function handleKey(e){if(e.key==='Enter'){e.preventDefault();sendMessage();}}

function ts(){return new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit'});}
function inner(){return document.getElementById('chatMessages').querySelector('div');}
function rmBanner(){const b=document.querySelector('#chatMessages .banner-logo');if(b){const w=b.closest('[style*="padding:16px 0 24px"]')||b.parentElement;if(w)w.remove();}}

function addUser(text){
  const el=document.createElement('div');el.style.cssText='margin-bottom:32px;animation:fadeUp .4s both;';
  el.innerHTML='<div style="display:flex;justify-content:flex-end;"><div style="max-width:78%;"><div style="padding:14px 20px;background:rgba(253,199,44,.1);border:1px solid rgba(253,199,44,.35);font-family:\'Chakra Petch\',sans-serif;font-size:14px;letter-spacing:.04em;line-height:1.7;color:#FDC72C;"></div><div style="text-align:right;margin-top:5px;font-family:\'Space Mono\',monospace;font-size:8px;letter-spacing:.12em;color:rgba(253,199,44,.35);">Roland G. · '+ts()+'</div></div></div>';
  el.querySelector('div>div>div').textContent=text;
  const t=document.getElementById('typingIndicator');inner().insertBefore(el,t);
}
function addAI(){
  const el=document.createElement('div');el.style.cssText='margin-bottom:32px;animation:fadeUp .4s both;';
  el.innerHTML='<div style="display:flex;align-items:flex-start;gap:14px;"><img src="empire-logo.png" alt="6" style="flex-shrink:0;width:28px;height:28px;object-fit:contain;margin-top:2px;filter:drop-shadow(0 0 6px rgba(253,199,44,.35));"><div style="flex:1;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="font-family:\'Chakra Petch\',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;color:#FDC72C;">EMPIRE AI</span><span style="font-family:\'Space Mono\',monospace;font-size:9px;color:rgba(253,199,44,.3);">'+ts()+'</span></div><div class="ai-body" style="font-family:\'Sora\',sans-serif;font-size:15px;line-height:1.8;color:#FDC72C;white-space:pre-wrap;"></div></div></div>';
  const t=document.getElementById('typingIndicator');inner().insertBefore(el,t);
  return el.querySelector('.ai-body');
}
async function sendMessage(){
  const i=document.getElementById('chatInput');if(!i||!i.value.trim())return;
  const text=i.value.trim();i.value='';rmBanner();
  addUser(text);history.push({role:'user',content:text});
  const msgs=document.getElementById('chatMessages');const typing=document.getElementById('typingIndicator');
  typing.style.display='block';msgs.scrollTop=msgs.scrollHeight;
  const out=addAI();let acc='';
  try{
    const res=await fetch(api('/api/chat'),{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:MODEL,mode:MODE,messages:history})});
    typing.style.display='none';
    const rd=res.body.getReader(),dec=new TextDecoder();
    while(true){const{done,value}=await rd.read();if(done)break;acc+=dec.decode(value,{stream:true});out.textContent=acc;msgs.scrollTop=msgs.scrollHeight;}
    out.textContent=acc||'(no response)';history.push({role:'assistant',content:acc});
    if(speakOn&&acc)speak(acc);
  }catch(e){typing.style.display='none';out.textContent='⚠️ '+e.message;}
}

/* voice */
function speak(t){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.replace(/[*#`>_]/g,''));u.rate=1.02;u.pitch=.95;const vs=speechSynthesis.getVoices();const v=vs.find(x=>/Daniel|Google UK English Male|Alex/i.test(x.name))||vs.find(x=>/en[-_]/i.test(x.lang));if(v)u.voice=v;speechSynthesis.speak(u);}
(function(){
  const i=document.getElementById('chatInput');if(i)i.focus();
  // wire mic + speaker (the design's mic button is the 2nd <button> with the rect mic svg)
  const micBtn=[...document.querySelectorAll('button')].find(b=>b.querySelector('rect[x="5"]'));
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(micBtn&&SR){
    let rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.continuous=false;let fin='';let live=false;
    rec.onstart=()=>{live=true;micBtn.style.color='#e23b3b';fin='';};
    rec.onresult=(e)=>{let it='';for(let k=e.resultIndex;k<e.results.length;k++){const x=e.results[k][0].transcript;if(e.results[k].isFinal)fin+=x;else it+=x;}const inp=document.getElementById('chatInput');inp.value=(fin+it).trim();};
    rec.onerror=()=>{live=false;micBtn.style.color='rgba(253,199,44,.45)';};
    rec.onend=()=>{live=false;micBtn.style.color='rgba(253,199,44,.45)';if(document.getElementById('chatInput').value.trim()){speakOn=true;sendMessage();}};
    micBtn.onclick=()=>{if(live){rec.stop();return;}try{speechSynthesis.cancel();rec.start();}catch(_){}};
  }
})();
"""

INDEX = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>EMPIRE AI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Sora:wght@200;300;400;500;600&display=swap" rel="stylesheet">
<style>
html,body{{background:#050608;margin:0;padding:0;height:100%;}}
{styles}
</style>
</head>
<body>
{body}
<script>{app_js}</script>
</body>
</html>
"""
open("./chat.html","w",encoding="utf-8").write(INDEX)
print("chat.html written:", len(INDEX), "bytes",
      "| handlers wired:", body.count('onclick='),
      "| leftover {{:", body.count('{{'),
      "| logo refs:", INDEX.count('empire-logo.png'))
