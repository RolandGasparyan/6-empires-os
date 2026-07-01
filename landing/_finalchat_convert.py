#!/usr/bin/env python3
"""Restore the Jun-27 'final option' rich chat design, wired to the live EMPIRE brain + voice."""
import re

src = open("./_finalchat_source.dc.html", encoding="utf-8").read()

# styles from the two <style> blocks in <helmet>
styles = ''.join(re.findall(r'<style>(.*?)</style>', src, flags=re.S))

# body: first real container div after </helmet> up to </x-dc>
m = re.search(r'</helmet>\s*(.*?)</x-dc>', src, re.S)
body = m.group(1)

# resolve every {{ handler }} onClick/onKeyDown/onChange/onFocus binding
def wire(b):
    b = re.sub(r'onClick="\{\{ (\w+) \}\}"',   lambda m: f'onclick="{m.group(1)}(this,event)"', b)
    b = re.sub(r'onKeyDown="\{\{ (\w+) \}\}"', lambda m: f'onkeydown="{m.group(1)}(this,event)"', b)
    b = re.sub(r'onKeyUp="\{\{ (\w+) \}\}"',   lambda m: f'onkeyup="{m.group(1)}(this,event)"', b)
    b = re.sub(r'onChange="\{\{ (\w+) \}\}"',  lambda m: f'onchange="{m.group(1)}(this,event)"', b)
    b = re.sub(r'onFocus="\{\{ (\w+) \}\}"',   lambda m: f'onfocus="{m.group(1)}(this,event)"', b)
    b = re.sub(r'onInput="\{\{ (\w+) \}\}"',   lambda m: f'oninput="{m.group(1)}(this,event)"', b)
    return b
body = wire(body)
# any stray remaining {{ x }} -> empty
body = re.sub(r'\{\{[^}]*\}\}', '', body)
# emblem swap + drop brightness washes
for _n in ('6-empires-emblem.png','6-empires-logo.png','6empires-logo.png','empire-logo.png'):
    body = body.replace(_n, 'empire-emblem.png')
body = body.replace('brightness(1.1)','').replace('brightness(1.3)','')
body = re.sub(r'\sdata-comment-anchor="[^"]*"', '', body)
# swap the compass-star welcome SVG for the clean gold emblem medallion
import re as _re
body = _re.sub(r'<svg class="banner-logo".*?</svg>',
    '<img class="banner-logo" src="empire-emblem.png" alt="6-EMPIRE" '
    'style="width:300px;height:300px;object-fit:contain;'
    'filter:drop-shadow(0 0 46px rgba(253,199,44,.6));'
    'animation:spinSlow 28s linear infinite;" />',
    body, count=1, flags=_re.S)

APP = r"""
const BASE=(location.pathname.replace(/\/[^/]*$/,'')+'/').replace(/\/+$/,'/');
const api=(p)=>BASE.replace(/\/$/,'')+p;
let MODEL='empire-prime', MODE='empire', speakOut=false, history=[];
const MODELMAP={PRIME:'empire-prime',MEDIA:'empire-media',NEXUS:'empire-research'};
const MODEMAP={'EMPIRE CORE':'empire','RAPID FIRE':'empire','DEEP RESEARCH':'academic','CREATIVE':'builder'};
const $=(id)=>document.getElementById(id);

/* ---- model / mode ---- */
function toggleModelMenu(){const m=$('modelMenu');if(!m)return;m.style.display=m.style.display==='block'?'none':'block';
  if(m.style.display==='block'){setTimeout(()=>{const c=(e)=>{if(!m.contains(e.target)){m.style.display='none';document.removeEventListener('click',c);}};document.addEventListener('click',c);},50);}}
function setModel(btn){const k=btn.getAttribute('data-model');MODEL=MODELMAP[k]||'empire-prime';
  const l=$('activeModelLabel');if(l)l.textContent=k;
  document.querySelectorAll('#modelMenu [data-model]').forEach(b=>{const a=b.getAttribute('data-model')===k;b.style.color=a?'#FDC72C':'rgba(253,199,44,.45)';const d=b.querySelector('div');if(d)d.style.background=a?'#FDC72C':'rgba(253,199,44,.3)';});
  const m=$('modelMenu');if(m)m.style.display='none';}
function setMode(btn){const k=btn.getAttribute('data-mode');MODE=MODEMAP[k]||'empire';
  document.querySelectorAll('[data-mode]').forEach(b=>{const a=b.getAttribute('data-mode')===k;b.style.background=a?'rgba(253,199,44,.08)':'none';b.style.color=a?'#FDC72C':'rgba(253,199,44,.45)';});
  const m=$('modelMenu');if(m)m.style.display='none';}

/* ---- projects ---- */
function toggleProjects(){const p=$('projectsPanel');if(!p)return;p.style.display=p.style.display==='flex'?'none':'flex';}
function projectOpen(){window.open('https://6-empires.com/world/empire-hq','_blank');}
function projectEdit(){toggleProjects();}

/* ---- upload ---- */
function handleUpload(inp){const f=inp.files&&inp.files[0];if(!f)return;const i=$('chatInput');if(i){i.value='[Attached: '+f.name+'] '+i.value;i.focus();}}

/* ---- command palette (Cmd/Ctrl+K) ---- */
function toggleCmdPalette(){const p=$('commandPalette');if(!p)return;const open=p.style.display==='flex';p.style.display=open?'none':'flex';if(!open){setTimeout(()=>{const s=$('cmdSearch');if(s)s.focus();},60);}}
function cmdExecute(el){const cmd=(el.getAttribute('data-cmd')||el.textContent||'').trim();const i=$('chatInput');if(i){i.value=cmd.charAt(0).toUpperCase()+cmd.slice(1)+': ';i.focus();}const p=$('commandPalette');if(p)p.style.display='none';}
function cmdEnter(el,e){if(e&&e.key==='Enter'){const first=document.querySelector('#cmdResults [data-cmd]');if(first)cmdExecute(first);}if(e&&e.key==='Escape'){const p=$('commandPalette');if(p)p.style.display='none';}}

/* ---- suggestions ---- */
function showSuggestions(){const s=$('suggestions');if(s)s.style.opacity='1';}
function applySuggestion(el){const t=el.getAttribute('data-suggest');const i=$('chatInput');if(i&&t){i.value=t;i.focus();}}

/* ---- message context actions ---- */
function copyMessage(el){const m=el.closest('[data-msg-id]');const b=m&&m.querySelector('.msg-body');if(b)navigator.clipboard&&navigator.clipboard.writeText(b.textContent);hideMsgMenu();}
function regenerateMessage(){const last=[...history].reverse().find(x=>x.role==='user');if(last){$('chatInput').value=last.content;sendMessage();}hideMsgMenu();}
function editMessage(el){const m=el.closest('[data-msg-id]');const b=m&&m.querySelector('.msg-body');if(b){$('chatInput').value=b.textContent;$('chatInput').focus();}hideMsgMenu();}
function deleteMessage(el){const m=el.closest('[data-msg-id]');if(m)m.remove();hideMsgMenu();}
function hideMsgMenu(){const mm=$('messageMenu');if(mm)mm.style.display='none';}

/* ---- voice ---- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,listening=false;
function vDisp(t){const d=$('voiceDisplay');if(!d)return;if(t){d.textContent=t;d.style.display='block';}else{d.style.display='none';}}
function toggleVoiceInput(){const b=$('voiceMicBtn');if(!SR){vDisp('Voice input needs Chrome/Edge');return;}
  if(listening){rec.stop();return;}
  rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.continuous=false;let fin='';
  rec.onstart=()=>{listening=true;b&&b.classList.add('voice-listening');vDisp('Listening…');};
  rec.onresult=(e)=>{let it='';for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i][0].transcript;if(e.results[i].isFinal)fin+=x;else it+=x;}$('chatInput').value=(fin+it).trim();vDisp((fin+it).trim()||'Listening…');};
  rec.onerror=()=>{listening=false;b&&b.classList.remove('voice-listening');b&&b.classList.add('voice-error');vDisp('');setTimeout(()=>b&&b.classList.remove('voice-error'),1500);};
  rec.onend=()=>{listening=false;b&&b.classList.remove('voice-listening');vDisp('');if($('chatInput').value.trim()){speakOut=true;setSpeaker(true);sendMessage();}};
  try{speechSynthesis.cancel();rec.start();}catch(_){}}
function setSpeaker(on){const b=$('voiceSpeakerBtn');if(b){b.style.color=on?'#FDC72C':'rgba(253,199,44,.45)';b.classList.toggle('voice-speaking',false);}}
function toggleVoiceOutput(){speakOut=!speakOut;setSpeaker(speakOut);if(!speakOut)speechSynthesis.cancel();}
function speak(t){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.replace(/[*#`>_]/g,''));u.rate=1.02;u.pitch=.95;const vs=speechSynthesis.getVoices();const v=vs.find(x=>/Daniel|Google UK English Male|Alex/i.test(x.name))||vs.find(x=>/en[-_]/i.test(x.lang));if(v)u.voice=v;const b=$('voiceSpeakerBtn');b&&b.classList.add('voice-speaking');u.onend=()=>b&&b.classList.remove('voice-speaking');speechSynthesis.speak(u);}

/* ---- send / stream from the live brain ---- */
function handleKey(el,e){if(e&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}
function rmBanner(){const b=document.querySelector('#chatMessages .banner-logo');if(b){const w=b.closest('div[style*="padding:16px 0 24px"]')||b.parentElement;if(w)w.remove();}}
let _mid=0;
function bubbleUser(text){
  const inner=$('chatMessages').querySelector('div');const t=$('typingIndicator');
  const el=document.createElement('div');el.setAttribute('data-msg-id',++_mid);el.style.cssText='margin-bottom:32px;animation:fadeUp .4s both;';
  el.innerHTML='<div style="display:flex;justify-content:flex-end;"><div style="max-width:78%;"><div class="msg-body" style="padding:14px 20px;background:rgba(253,199,44,.1);border:1px solid rgba(253,199,44,.35);font-family:\'Chakra Petch\',sans-serif;font-size:14px;letter-spacing:.04em;line-height:1.7;color:#FDC72C;"></div><div style="text-align:right;margin-top:5px;font-family:\'Space Mono\',monospace;font-size:8px;letter-spacing:.12em;color:rgba(253,199,44,.35);">Roland G. · '+ts()+'</div></div></div>';
  el.querySelector('.msg-body').textContent=text;inner.insertBefore(el,t);
}
function bubbleAI(){
  const inner=$('chatMessages').querySelector('div');const t=$('typingIndicator');
  const el=document.createElement('div');el.setAttribute('data-msg-id',++_mid);el.style.cssText='margin-bottom:32px;animation:fadeUp .4s both;';
  el.innerHTML='<div style="display:flex;align-items:flex-start;gap:14px;"><img src="empire-emblem.png" alt="6" style="flex-shrink:0;width:28px;height:28px;object-fit:contain;margin-top:2px;filter:drop-shadow(0 0 6px rgba(253,199,44,.35));"><div style="flex:1;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="font-family:\'Chakra Petch\',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;color:#FDC72C;">EMPIRE AI</span><span style="font-family:\'Space Mono\',monospace;font-size:9px;color:rgba(253,199,44,.3);">'+ts()+'</span></div><div class="msg-body" style="font-family:\'Sora\',sans-serif;font-size:15px;line-height:1.8;color:#FDC72C;white-space:pre-wrap;"></div></div></div>';
  inner.insertBefore(el,t);return el.querySelector('.msg-body');
}
function ts(){return new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit'});}
async function sendMessage(){
  const i=$('chatInput');if(!i||!i.value.trim())return;const text=i.value.trim();i.value='';rmBanner();
  const s=$('suggestions');if(s)s.style.opacity='0';
  bubbleUser(text);history.push({role:'user',content:text});
  const msgs=$('chatMessages'),typing=$('typingIndicator');typing.style.display='block';msgs.scrollTop=msgs.scrollHeight;
  const out=bubbleAI();let acc='';
  try{
    const res=await fetch(api('/api/chat'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,mode:MODE,messages:history})});
    typing.style.display='none';const rd=res.body.getReader(),dec=new TextDecoder();
    while(true){const{done,value}=await rd.read();if(done)break;acc+=dec.decode(value,{stream:true});out.textContent=acc;msgs.scrollTop=msgs.scrollHeight;}
    out.textContent=acc||'(no response)';history.push({role:'assistant',content:acc});if(speakOut&&acc)speak(acc);
  }catch(e){typing.style.display='none';out.textContent='⚠️ '+e.message;}
}
/* global shortcuts + focus */
document.addEventListener('keydown',(e)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();toggleCmdPalette();}if(e.key==='Escape'){const p=$('commandPalette');if(p)p.style.display='none';hideMsgMenu();}});
window.addEventListener('DOMContentLoaded',()=>{const i=$('chatInput');if(i)i.focus();});
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
html,body{{background:#050608;margin:0;padding:0;height:100%;overflow:hidden;}}
{styles}
</style>
</head>
<body>
{body}
<script>{APP}</script>
</body>
</html>
"""
open("./chat-final.html","w",encoding="utf-8").write(INDEX)
print("chat-final.html:", len(INDEX), "bytes | leftover {{:", INDEX.count('{{'),
      "| onclick wired:", body.count('onclick='), "| emblem:", INDEX.count('empire-emblem.png'))
