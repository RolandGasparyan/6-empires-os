'use client';
// The "/" front door is the cinematic Sovereign OS v6 landing page, served as a
// static bundle from public/home-v6/index.html via a beforeFiles rewrite in
// next.config.js. This component is only a fallback if that rewrite is ever
// bypassed — it forwards to the living isometric AI office (empire-hq).
export { default } from './empire-hq/page';
