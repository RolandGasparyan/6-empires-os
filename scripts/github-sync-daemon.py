#!/usr/bin/env python3
"""
EMPIRE GitHub Sync Daemon
Bidirectional real-time synchronization between EMPIRE Assistant and GitHub repositories.
"""

import os
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path
import threading
from queue import Queue

class GitHubSyncDaemon:
    def __init__(self, config_file=None):
        self.config_file = config_file or Path.home() / '.empire' / 'github-sync.json'
        self.config = self.load_config()
        self.sync_queue = Queue()
        self.running = False
        self.repos = []

    def load_config(self):
        """Load GitHub sync configuration"""
        if self.config_file.exists():
            with open(self.config_file) as f:
                return json.load(f)
        return {
            "github_user": "RolandGasparyan",
            "sync_enabled": True,
            "sync_direction": "bidirectional",
            "sync_frequency": "real-time",
            "repos": [],
            "webhook_secret": os.environ.get('GITHUB_WEBHOOK_SECRET', ''),
            "auto_commit": True,
            "auto_commit_message": "🔄 Auto-sync from EMPIRE [{timestamp}]"
        }

    def save_config(self):
        """Save configuration to file"""
        self.config_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)

    def get_user_repos(self):
        """Fetch all repos for configured GitHub user"""
        user = self.config["github_user"]
        try:
            result = subprocess.run(
                ["curl", "-s", f"https://api.github.com/users/{user}/repos?per_page=100"],
                capture_output=True,
                text=True
            )
            repos = json.loads(result.stdout)
            self.repos = [r['name'] for r in repos if not r.get('fork')]
            return self.repos
        except Exception as e:
            print(f"❌ Error fetching repos: {e}")
            return []

    def sync_repo(self, repo_name):
        """Sync a single repository"""
        try:
            print(f"🔄 Syncing repo: {repo_name}")

            # Pull latest changes
            subprocess.run(["git", "pull", "origin", "main"],
                         capture_output=True, timeout=30)

            # Check for changes
            status = subprocess.run(["git", "status", "--porcelain"],
                                  capture_output=True, text=True, timeout=10)

            if status.stdout.strip():
                # Stage and commit changes
                subprocess.run(["git", "add", "-A"], capture_output=True)

                msg = self.config["auto_commit_message"].format(
                    timestamp=datetime.now().isoformat()
                )
                subprocess.run(["git", "commit", "-m", msg],
                             capture_output=True)

                # Push to GitHub
                subprocess.run(["git", "push", "origin", "main"],
                             capture_output=True, timeout=30)

                print(f"✅ {repo_name}: Changes synced")
                return True
            else:
                print(f"✓ {repo_name}: No changes")
                return False
        except subprocess.TimeoutExpired:
            print(f"⏱️ {repo_name}: Sync timeout")
            return False
        except Exception as e:
            print(f"❌ {repo_name}: Sync failed - {e}")
            return False

    def sync_all_repos(self):
        """Sync all configured repositories"""
        print(f"\n{'='*60}")
        print(f"🔄 EMPIRE GitHub Sync - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")

        results = []
        for repo in self.repos:
            result = self.sync_repo(repo)
            results.append((repo, result))

        synced = sum(1 for _, r in results if r)
        print(f"\n✅ Sync complete: {synced}/{len(self.repos)} repos updated\n")
        return results

    def start_daemon(self, interval=300):
        """Start sync daemon (runs every interval seconds)"""
        self.running = True
        print(f"🚀 EMPIRE GitHub Sync Daemon started")
        print(f"📍 User: {self.config['github_user']}")
        print(f"🔄 Frequency: Every {interval}s ({interval/60:.0f}min)")
        print(f"📚 Repos to sync: {', '.join(self.repos)}")

        try:
            while self.running:
                self.sync_all_repos()
                time.sleep(interval)
        except KeyboardInterrupt:
            self.stop_daemon()

    def stop_daemon(self):
        """Stop sync daemon"""
        self.running = False
        print("\n⛔ EMPIRE GitHub Sync Daemon stopped")

    def register_webhook(self, webhook_url):
        """Register GitHub webhook for real-time sync"""
        print(f"📡 Registering webhook: {webhook_url}")
        print("ℹ️  Add this to your GitHub repo settings:")
        print(f"   Payload URL: {webhook_url}/github/webhook")
        print(f"   Events: Push, Pull Request")
        print(f"   Secret: {self.config['webhook_secret']}")

def main():
    """Main entry point"""
    daemon = GitHubSyncDaemon()

    # Get all repos
    repos = daemon.get_user_repos()
    if repos:
        daemon.config["repos"] = repos
        daemon.save_config()
        print(f"✅ Found {len(repos)} repos:")
        for repo in repos:
            print(f"   • {repo}")

    # Start sync daemon (every 5 minutes by default)
    try:
        daemon.start_daemon(interval=300)
    except Exception as e:
        print(f"❌ Daemon error: {e}")

if __name__ == "__main__":
    main()
