# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Network-resilient install: tolerate registry blips (ECONNRESET) with retries + long timeout.
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 4 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 600000 \
 && npm config set fetch-timeout 1200000 \
 && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund)

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* are inlined into the client bundle at BUILD time, so they must
# be present here as build args. Passing them only at runtime (compose
# `environment:`) is too late — the bundle is already frozen, which is what
# pinned the UI to mock/SIM data instead of the live twin.
ARG NEXT_PUBLIC_API_BASE
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_USE_MOCK
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_USE_MOCK=$NEXT_PUBLIC_USE_MOCK \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- run ----
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# Static assets (logo SVGs, hero render) — `next start` serves these from /public.
COPY --from=build /app/public ./public
# next.config.js is needed at runtime so `next start` applies the same config
# (React-dedup webpack alias, transpilePackages) used during the build.
COPY --from=build /app/next.config.js ./next.config.js
EXPOSE 3000
CMD ["npm", "start"]
