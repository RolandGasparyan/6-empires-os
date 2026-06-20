#!/usr/bin/env bash
docker run --rm empire-world:latest grep -c '/world' /app/.next/routes-manifest.json || echo "0 (no basePath in manifest)"
echo "--- required-server-files ---"
docker run --rm empire-world:latest sh -lc 'cat /app/.next/required-server-files.json 2>/dev/null | grep -o "\"basePath\":\"[^\"]*\"" | head -1 || echo none'
