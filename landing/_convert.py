#!/usr/bin/env python3
"""Convert the Claude Design handoff (6-EMPIRES.dc.html) into a clean standalone index.html."""
import re, html

src = open("./_source.dc.html", encoding="utf-8").read()

# 1) Extract the scene body: everything inside <div data-six-root ...> ... </div></div></x-dc>
m = re.search(r'(<div data-six-root[^>]*>.*?</div>\s*</div>\s*</x-dc>)', src, re.S)
body = m.group(1)
# drop the trailing </div></div></x-dc> closers count: the root div + an inner wrapper; we keep our own wrapper
body = re.sub(r'</x-dc>\s*$', '', body)

# 2) Resolve template bindings (hardcode the design defaults)
binds = {
    '{{ bgColor }}': '#000000',
    '{{ accentColor }}': '#F8E231',
    '{{ heroTitle }}': 'EMPIRES',
    '{{ logoSizePx }}': '180px',
    '{{ showWhiteLogo }}': 'true',
    '{{ true }}': 'true',
}
for k, v in binds.items():
    body = body.replace(k, v)

# 3) Unwrap <sc-if ...> ... </sc-if>  -> keep inner content (white logo shown)
body = re.sub(r'<sc-if[^>]*>(.*?)</sc-if>', r'\1', body, flags=re.S)

# 4) Replace founder portrait <x-import image-slot ...></x-import> with a gold logo block
portrait_replacement = (
    '<div style="display:block;width:100%;aspect-ratio:4/5;border:1px solid rgba(248,226,49,.3);'
    'background:linear-gradient(160deg,#0c1018,#070a0e);display:flex;align-items:center;justify-content:center;'
    'filter:grayscale(.1);">'
    '<img src="empire-logo.png" alt="6-EMPIRE" style="width:62%;height:auto;filter:drop-shadow(0 0 30px rgba(248,226,49,.4));" />'
    '</div>'
)
body = re.sub(r'<x-import[^>]*image-slot[^>]*>.*?</x-import>', portrait_replacement, body, flags=re.S)
# any other x-import -> drop
body = re.sub(r'<x-import[^>]*>.*?</x-import>', '', body, flags=re.S)
body = re.sub(r'<x-import[^>]*/?>', '', body)

# 5) strip remaining custom tags / attrs that won't run
body = re.sub(r'\sdata-comment-anchor="[^"]*"', '', body)
body = re.sub(r'\shint-[a-z]+="[^"]*"', '', body)
body = re.sub(r'<helmet>.*?</helmet>', '', body, flags=re.S)

# 6) Pull the <style> blocks from the original <helmet>/head so animations work
styles = ''.join(re.findall(r'<style>(.*?)</style>', src, flags=re.S))

# 7) Pull the manhattanBg canvas drawing code from the dc-script and wrap as plain JS
dc = re.search(r'data-dc-script[^>]*>(.*?)</script>', src, re.S)
dcjs = dc.group(1) if dc else ''
# extract the three methods we need: _buildManhattan, _drawManhattan (initManhattanBg loop we recreate)
def grab(name):
    mm = re.search(r'%s\s*\([^)]*\)\s*\{' % re.escape(name), dcjs)
    if not mm: return ''
    i = mm.end()-1; depth=0
    for j in range(i, len(dcjs)):
        if dcjs[j]=='{': depth+=1
        elif dcjs[j]=='}':
            depth-=1
            if depth==0:
                return dcjs[mm.start():j+1]
    return ''
build = grab('_buildManhattan')
draw  = grab('_drawManhattan')

open("./_body.html","w",encoding="utf-8").write(body)
open("./_styles.css","w",encoding="utf-8").write(styles)
open("./_build.js","w",encoding="utf-8").write(build)
open("./_draw.js","w",encoding="utf-8").write(draw)
print("body len", len(body), "styles", len(styles), "build", len(build), "draw", len(draw))
