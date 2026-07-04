#!/usr/bin/env python3
body   = open("./_body.html",encoding="utf-8").read()
styles = open("./_styles.css",encoding="utf-8").read()
try:
    enhancements = open("./_enhancements.js",encoding="utf-8").read()
except FileNotFoundError:
    enhancements = ""

# All runtime behavior (manhattanBg canvas build+draw+resize loop, bg mesh,
# skyline, cursor glow, magnetic buttons, text scramble, agent/mesh/trading
# canvases, city audio, and the scroll-driven HUD — progress rail, phase
# label, coords, depth parallax, tower rotation, [data-reveal] fade-ins) is
# driven by SIX2.componentDidMount() inside enhancements.js (see
# _convert.py). No separate hand-rolled canvas/reveal scripts needed.
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
<script>{enhancements}</script>
</body>
</html>
"""
open("./index.html","w",encoding="utf-8").write(INDEX)
print("index.html written:", len(INDEX), "bytes")
