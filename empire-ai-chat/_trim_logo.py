#!/usr/bin/env python3
"""Remove the dark rounded badge behind the gold EMPIRE mark.
Flood-fill from the edges: any pixel reachable from the border that is dark
(low brightness) becomes fully transparent. The gold mark/text in the centre
is bright, so the fill stops there — leaving the gold floating on transparency.
"""
from PIL import Image
from collections import deque

src = "empire-logo.orig.png"
out = "empire-logo.png"

im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()

# brightness threshold: pixels darker than this are "background"
DARK = 70  # 0-255

def is_dark(p):
    r, g, b, a = p
    if a == 0:
        return True
    # luminance
    return (0.299*r + 0.587*g + 0.114*b) < DARK

visited = bytearray(w * h)
q = deque()

# seed from all border pixels
for x in range(w):
    for y in (0, h-1):
        q.append((x, y))
for y in range(h):
    for x in (0, w-1):
        q.append((x, y))

cleared = 0
while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= w or y >= h:
        continue
    idx = y*w + x
    if visited[idx]:
        continue
    visited[idx] = 1
    p = px[x, y]
    if not is_dark(p):
        continue
    # clear to transparent
    px[x, y] = (0, 0, 0, 0)
    cleared += 1
    q.append((x+1, y)); q.append((x-1, y))
    q.append((x, y+1)); q.append((x, y-1))

# soften any remaining near-black halo not connected to border but very dark
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a and (0.299*r + 0.587*g + 0.114*b) < 24:
            px[x, y] = (r, g, b, 0)

im.save(out)
print("cleared", cleared, "px ->", out, im.size)
