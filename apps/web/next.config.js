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
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  webpack: (config) => {
    // Force a SINGLE copy of @react-three/fiber and its zustand store across
    // all chunks. The "Hooks can only be used within the Canvas" error happens
    // when <Canvas> and the child useFrame/useThree resolve different fiber
    // module instances, so the child can't see the Canvas's context store.
    // Aliasing fiber + zustand to one resolved path is safe (no React/RSC).
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-three/fiber': path.resolve(__dirname, 'node_modules/@react-three/fiber'),
      zustand: path.resolve(__dirname, 'node_modules/zustand'),
    };
    return config;
  },
};
module.exports = nextConfig;
