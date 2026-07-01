# EMPIRE Voice Clone — Recording Guide

Goal: record **~30–40 minutes** of clean speech so we can train a Piper voice that sounds like you. The result is a local `.onnx` file that plugs into OpenHuman — fully offline.

## What you need
- A quiet room (no fans, AC, traffic, echo). A small carpeted room or closet is great.
- A decent mic: your AirPods are OK, a USB mic (Blue Yeti etc.) is better, MacBook built-in mic works in a pinch.
- ~40 minutes. You can split across sessions — just keep the **same mic, same room, same distance** every time.

## Recording settings (important)
- Format: **WAV, mono, 22050 Hz** (or 44100/48000 — I'll downsample). Avoid MP3 if you can.
- Stay **a consistent distance** from the mic (~15–20 cm / one hand-span).
- Speak **naturally** — your normal pace and tone. Don't "perform." The clone copies exactly how you sound here.
- Leave ~0.5 s of silence at the start and end of each take.
- If you flub a line, pause and re-read the whole sentence — I'll clean it up.

## How to record (easiest on Mac)
**Option A — QuickTime (built-in, free):**
1. Open QuickTime Player → File → New Audio Recording.
2. Click the ⌄ next to the record button → pick your mic + **Maximum** quality.
3. Record yourself reading `RECORDING-SCRIPT.txt` start to finish.
4. Save as `roland-voice.m4a` (I'll convert it).

**Option B — one long file vs many:** one continuous file reading the whole script is perfect. You don't need to split it — the training pipeline auto-segments + transcribes with Whisper.

## What to read
Read everything in **`RECORDING-SCRIPT.txt`** at a natural pace. It's phonetically balanced (covers all English sounds) so the voice generalizes well. If you have time, read it **twice** — more data = better clone.

Bonus: after the script, just talk freely for 5–10 minutes (describe your day, your business, anything) — natural speech makes the voice more lifelike.

## When done
Save the file and tell me where it is (e.g. Desktop or Downloads). I'll:
1. Convert + segment + transcribe it (Whisper)
2. Hand you a ready-to-run cloud training notebook (free GPU)
3. Install the resulting `your-voice.onnx` into OpenHuman → your assistant speaks in your voice.

Minimum viable: even **15 minutes** gives a usable voice. 30–40 min is the sweet spot. 60+ min is excellent.
