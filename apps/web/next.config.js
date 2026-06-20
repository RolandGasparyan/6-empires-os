/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // StrictMode double-invokes render in dev/build and is a known trigger for
  // "R3F: Hooks can only be used within the Canvas component!" — the Canvas
  // context store gets torn down on the throwaway first pass. R3F's own docs
  // recommend disabling it for fiber apps.
  reactStrictMode: false,

  // Compile the R3F ecosystem in-graph so it binds to Next's React (the only
  // copy here that exports `use`/`cache` + the modern internals). Do NOT alias
  // react/react-dom — see git history: that broke RSC cache() and hydration.
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
    'postprocessing',
  ],
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Mount under a sub-path (e.g. /world) when NEXT_PUBLIC_BASE_PATH is set at
  // build time. Empty by default so local dev + the root deploy are unaffected.
  ...(process.env.NEXT_PUBLIC_BASE_PATH
    ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH, assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH }
    : {}),
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // No webpack resolve.alias: deduping is handled by package.json `overrides`
  // (react/react-dom/three pinned) + transpilePackages. Webpack aliases on
  // these packages repeatedly broke deep sub-path imports
  // (three/examples/jsm/*, fiber dist) → "d(...) is not a function".
};
module.exports = nextConfig;
