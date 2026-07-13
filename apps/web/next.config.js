/** @type {import('next').NextConfig} */
function publicConnectOrigins() {
  const origins = new Set([
    'https://api.6-empires.com',
    'wss://api.6-empires.com',
    'http://localhost:8000',
    'ws://localhost:8000',
  ]);

  for (const rawUrl of [process.env.NEXT_PUBLIC_API_BASE, process.env.NEXT_PUBLIC_WS_URL]) {
    if (!rawUrl) continue;
    try {
      const url = new URL(rawUrl);
      if (['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) origins.add(url.origin);
    } catch {
      // Invalid public URLs fail elsewhere during configuration/startup; never
      // interpolate unparsed text into a security header.
    }
  }
  return [...origins].join(' ');
}

const nextConfig = {
  async redirects() {
    return [{
      source: '/login.html',
      destination: '/founder/login',
      permanent: true,
    }];
  },

  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      `connect-src 'self' ${publicConnectOrigins()}`,
    ].join('; ');

    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
      ],
    }];
  },

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
