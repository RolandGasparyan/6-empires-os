#!/usr/bin/env python3
"""
6-EMPIRE Second Brain consolidator.
Discovers every Obsidian vault + git repo under $HOME, pulls all *.md
knowledge files into one canonical vault (EmpireMemory/Obsidian_Second_Brain),
organized by venture, deduplicated by content hash. Copy-only: originals
are never touched or deleted.
"""
import os, sys, hashlib, shutil, json, subprocess, signal

DRY_RUN = "--dry-run" in sys.argv
HOME = os.path.expanduser("~")
TARGET = os.path.join(HOME, "EmpireMemory", "Obsidian_Second_Brain")

SKIP_DIR_NAMES = {
    "node_modules", ".git", ".obsidian", "venv", ".venv", "dist", "build",
    ".next", "__pycache__", "coverage", "target", "Pods", "DerivedData",
    ".cache", ".turbo", ".pytest_cache", "vendor", ".terraform",
    "site-packages", ".Trash",
}

# Legacy iCloud-synced folders from other Macs (large, often dataless /
# slow-to-fetch placeholders). Excluded from this pass -- flagged for
# manual follow-up rather than risking a multi-minute hang per file.
SLOW_MARKERS = ("mac studio", "macbook air")

# Verified (via `git remote get-url origin`) third-party clones -- NOT
# Roland's own work. These are other people's GitHub repos he pulled down
# as tools/references (frameworks, skill packs, awesome-lists), and would
# otherwise dump ~4,600 unrelated markdown files into the personal vault.
THIRD_PARTY_CLONES = {
    os.path.join(HOME, ".hermes", "hermes-agent"),       # NousResearch/hermes-agent
    os.path.join(HOME, "ECC"),                            # affaan-m/ECC
    os.path.join(HOME, "claude-scientific-skills"),       # K-Dense-AI/claude-scientific-skills
    os.path.join(HOME, "agent-skills"),                   # vercel-labs/agent-skills
    os.path.join(HOME, "awesome-claude-code-subagents"),  # VoltAgent/awesome-claude-code-subagents
    os.path.join(HOME, "RSSHub"),                         # DIYgod/RSSHub
    os.path.join(HOME, "obsidian-second-brain"),          # eugeniughelbur/obsidian-second-brain
    os.path.join(HOME, "mission-control"),                # crshdn/mission-control
    os.path.join(HOME, "jarvis"),                         # ethanplusai/jarvis
    os.path.join(HOME, "miroshark"),                      # aaronjmars/MiroShark
}

# Roots that hang on iCloud "Optimize Mac Storage" placeholder fetches --
# os.walk/os.scandir blocks in an apparently uninterruptible kernel wait
# here (SIGALRM does not break it), so a per-file timeout can't save us.
# Flagged for manual follow-up (force-download in Finder, then re-run)
# rather than risking an indefinite hang of the whole consolidation.
ICLOUD_STALL_ROOTS = {
    os.path.join(HOME, "Documents", "Guru"),
}

class Timeout(Exception):
    pass

def _alarm(signum, frame):
    raise Timeout()

signal.signal(signal.SIGALRM, _alarm)

def is_excluded_root(r):
    low = r.lower()
    claude_dir = os.path.join(HOME, ".claude")
    library_dir = os.path.join(HOME, "Library")
    r_norm = r.rstrip("/")
    home_norm = HOME.rstrip("/")
    # bare home directory itself (its own dotfiles .git) -- NEVER walk this,
    # it would recurse into the entire home folder.
    if r_norm == home_norm:
        return True
    if r == claude_dir or r.startswith(claude_dir + os.sep):
        return True
    if r == library_dir or r.startswith(library_dir + os.sep):
        return True
    if any(m in low for m in SLOW_MARKERS):
        return True
    if r_norm in THIRD_PARTY_CLONES:
        return True
    if r_norm in ICLOUD_STALL_ROOTS:
        return True
    return False

def discover_roots():
    roots = set()
    for name in (".obsidian",):
        out = subprocess.run(
            ["find", HOME, "-maxdepth", "6", "-type", "d", "-name", name],
            capture_output=True, text=True
        ).stdout
        for line in out.splitlines():
            if line:
                roots.add(os.path.dirname(line))
    out = subprocess.run(
        ["find", HOME, "-maxdepth", "5", "-type", "d", "-name", ".git"],
        capture_output=True, text=True
    ).stdout
    for line in out.splitlines():
        if line:
            roots.add(os.path.dirname(line))
    return sorted(r for r in roots if not is_excluded_root(r))

def classify(root):
    low = root.lower()
    if "reincarnation" in low:
        return "REINCARNATION"
    if "second_brain" in low or "second-brain" in low:
        return "Second-Brain-Archives"
    if any(k in low for k in ["trading", "guru", "strategy-lab", "tournament",
                               "risk-engine", "scalper", "kronos"]):
        return "Trading-Guru-Empire"
    if "empire" in low:
        return "6-EMPIRE"
    if "obsidian" in low:
        return "Second-Brain-Archives"
    return "Misc-Projects"

def iter_md_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES and not d.startswith(".")]
        for fn in filenames:
            if fn.lower().endswith(".md"):
                yield os.path.join(dirpath, fn)

def sha256_with_timeout(path, secs=3):
    signal.alarm(secs)
    try:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    finally:
        signal.alarm(0)

def main():
    roots = discover_roots()
    if "--list-roots" in sys.argv:
        for r in roots:
            print(f"{classify(r)}\t{r}")
        print(f"TOTAL_ROOTS={len(roots)}")
        return
    seen_hash = {}
    stats = {"roots": len(roots), "scanned": 0, "copied": 0,
             "exact_dupes_skipped": 0, "title_conflicts": 0,
             "errors": 0, "timeouts": 0}
    conflicts = []
    per_venture = {}
    skipped_paths = []

    print(f"roots_discovered={len(roots)}", flush=True)

    root_timeouts = []
    for i, root in enumerate(roots, 1):
        venture = classify(root)
        root_name = os.path.basename(root.rstrip("/")) or venture
        print(f"[{i}/{len(roots)}] {venture} :: {root}", flush=True)
        try:
            signal.alarm(20)  # covers os.walk/scandir stalls (e.g. iCloud placeholders)
            for src in iter_md_files(root):
                signal.alarm(15)  # re-arm per file so slow-but-alive roots aren't killed
                stats["scanned"] += 1
                try:
                    h = sha256_with_timeout(src)
                except Timeout:
                    stats["timeouts"] += 1
                    skipped_paths.append(src)
                    signal.alarm(15)
                    continue
                except Exception:
                    stats["errors"] += 1
                    signal.alarm(15)
                    continue
                rel = os.path.relpath(src, root)
                dest_dir = os.path.join(TARGET, venture, root_name, os.path.dirname(rel))
                dest = os.path.join(dest_dir, os.path.basename(rel))

                if h in seen_hash:
                    stats["exact_dupes_skipped"] += 1
                    continue

                if os.path.exists(dest):
                    try:
                        if sha256_with_timeout(dest) == h:
                            stats["exact_dupes_skipped"] += 1
                            seen_hash[h] = dest
                            signal.alarm(15)
                            continue
                    except Exception:
                        pass
                    base, ext = os.path.splitext(dest)
                    dest = f"{base}__conflict{ext}"
                    stats["title_conflicts"] += 1
                    conflicts.append({"src": src, "dest": dest})

                per_venture[venture] = per_venture.get(venture, 0) + 1
                seen_hash[h] = dest

                if not DRY_RUN:
                    os.makedirs(dest_dir, exist_ok=True)
                    shutil.copy2(src, dest)
                stats["copied"] += 1
        except Timeout:
            root_timeouts.append(root)
            print(f"  !! root timed out (likely iCloud placeholder stall), skipping rest of: {root}", flush=True)
        finally:
            signal.alarm(0)
        print(f"  -> running totals: {json.dumps(stats)}", flush=True)

    result = {"stats": stats, "per_venture": per_venture,
              "conflicts": conflicts[:50], "roots_used": roots,
              "timeout_paths": skipped_paths[:50], "root_timeouts": root_timeouts}
    out_path = "/tmp/second_brain_consolidate_report.json"
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)
    print("FINAL_STATS " + json.dumps(stats), flush=True)
    print("FINAL_VENTURE " + json.dumps(per_venture), flush=True)
    print("DONE", flush=True)

if __name__ == "__main__":
    main()
