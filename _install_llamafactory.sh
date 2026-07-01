#!/usr/bin/env bash
# Install LLaMA-Factory on the EMPIRE VPS (CPU box) in an isolated venv.
# Provides the CLI + Web UI (:7860). Training needs a GPU; this enables setup,
# dataset prep, config, and CPU inference/light tasks.
set -e
ssh -i ~/.ssh/empire_vps -o StrictHostKeyChecking=no root@64.227.6.197 'bash -s' <<'REMOTE'
set -e
cd /opt
if [ ! -d LLaMA-Factory ]; then
  git clone --depth 1 https://github.com/hiyouga/LLaMA-Factory.git
fi
cd LLaMA-Factory
echo "=== creating venv ==="
python3 -m venv .venv 2>/dev/null || true
. .venv/bin/activate
pip install -q --upgrade pip
echo "=== installing LLaMA-Factory (CPU torch — no CUDA) ==="
# CPU-only torch keeps the install lean on this GPU-less box
pip install -q torch --index-url https://download.pytorch.org/whl/cpu || pip install -q torch
pip install -q -e ".[metrics]" 2>&1 | tail -3 || pip install -q -e . 2>&1 | tail -3
echo "=== version check ==="
llamafactory-cli version 2>&1 | head -5 || python -c "import llamafactory, sys; print('llamafactory OK', llamafactory.__version__ if hasattr(llamafactory,'__version__') else '')"
echo "INSTALL_DONE"
REMOTE
