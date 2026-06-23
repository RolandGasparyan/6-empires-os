#!/usr/bin/env bash
# Run from the repo root on your Mac (you have GitHub auth there):
#   bash empire-ops/PUSH-TO-GITHUB.sh
set -e
cd "$(git rev-parse --show-toplevel)"
git add empire-ops/
git commit -m "Add empire-ops: GOD MODE prompts, 19 free LLM APIs, MCP server, Obsidian vault, system state" || echo "(nothing new to commit)"
git push origin "$(git branch --show-current)"
echo "Pushed empire-ops to GitHub."
