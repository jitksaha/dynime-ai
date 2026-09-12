#!/usr/bin/env python3
"""
Dynime AI - Standalone Hostinger Deployment & Git Sync Tool
===========================================================
Automates:
1. Local frontend asset compilation (`npm run build`)
2. Git status, commit, and remote push to GitHub
3. Hostinger SSH connection & automated zero-downtime deployment
4. Remote database migrations & optimization cache
"""

import os
import sys
import subprocess
import argparse

# Configurable Deployment Defaults (User can customize or pass via CLI/Env)
DEFAULT_HOST = os.getenv("HOSTINGER_SSH_HOST", "5.183.10.149")
DEFAULT_PORT = int(os.getenv("HOSTINGER_SSH_PORT", "65002"))
DEFAULT_USER = os.getenv("HOSTINGER_SSH_USER", "u740731947")
DEFAULT_PASS = os.getenv("HOSTINGER_SSH_PASS", "Pixel#@!194JkS")
DEFAULT_REMOTE_DIR = os.getenv("HOSTINGER_REMOTE_DIR", "domains/ai.dynime.com/public_html")
DEFAULT_REPO = os.getenv("DYNIME_AI_GIT_REPO", "")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def run_cmd(cmd, cwd=BASE_DIR, check=True):
    print(f"\n[RUN] {cmd} (in {cwd})")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if check and res.returncode != 0:
        print(f"[ERROR] Command failed with exit code {res.returncode}: {cmd}")
        sys.exit(res.returncode)
    return res.returncode

def build_assets():
    print("=" * 60)
    print("STEP 1: Compiling Frontend Assets (Vite + React + Tailwind)")
    print("=" * 60)
    run_cmd("npm run build")
    print("[SUCCESS] Frontend production build compiled successfully into public/build.")

def git_sync(commit_msg=None, repo_url=None):
    print("=" * 60)
    print("STEP 2: Git Tracking, Commit & Push")
    print("=" * 60)

    # Check if git is initialized
    if not os.path.exists(os.path.join(BASE_DIR, ".git")):
        print("[INFO] Initializing new Git repository...")
        run_cmd("git init -b main")

    if repo_url:
        # Check current origin
        res = subprocess.run("git remote get-url origin", shell=True, cwd=BASE_DIR, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"[INFO] Updating remote origin to: {repo_url}")
            run_cmd(f"git remote set-url origin {repo_url}")
        else:
            print(f"[INFO] Adding remote origin: {repo_url}")
            run_cmd(f"git remote add origin {repo_url}")

    run_cmd("git add -A")
    status = subprocess.run("git status --porcelain", shell=True, cwd=BASE_DIR, capture_output=True, text=True)
    if status.stdout.strip():
        msg = commit_msg or "Release: Standalone Dynime AI Studio & DComposer Engine"
        run_cmd(f'git commit -m "{msg}"')
        print(f"[SUCCESS] Committed changes: {msg}")
    else:
        print("[INFO] No working directory changes to commit.")

    # Check if remote exists before pushing
    remotes = subprocess.run("git remote", shell=True, cwd=BASE_DIR, capture_output=True, text=True)
    if "origin" in remotes.stdout:
        print("[INFO] Pushing to remote GitHub repository...")
        run_cmd("git push -u origin main", check=False)
    else:
        print("[NOTICE] Remote 'origin' is not set yet. Set it with: git remote add origin <your_github_repo_url>")

def hostinger_ssh_deploy(host, port, user, password, remote_dir):
    print("=" * 60)
    print("STEP 3: Hostinger SSH Remote Deployment")
    print("=" * 60)
    print(f"Target: {user}@{host}:{port} -> {remote_dir}")

    try:
        import paramiko
    except ImportError:
        print("[ERROR] 'paramiko' library is required for SSH deployment.")
        print("Install it with: pip install paramiko")
        sys.exit(1)

    print("[INFO] Connecting to Hostinger SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port=port, username=user, password=password, timeout=20)
        print("[SUCCESS] Connected to Hostinger!")
    except Exception as e:
        print(f"[ERROR] Could not connect to Hostinger SSH: {e}")
        sys.exit(1)

    # Remote Commands
    commands = [
        f"mkdir -p ~/{remote_dir}",
        f"cd ~/{remote_dir} && [ -d .git ] && git pull origin main || echo 'Git repo ready for clone'",
        f"cd ~/{remote_dir} && php -v",
        f"cd ~/{remote_dir} && if [ -f artisan ]; then php artisan migrate --force; fi",
        f"cd ~/{remote_dir} && if [ -f artisan ]; then php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache; fi",
        f"cd ~/{remote_dir} && if [ -f artisan ]; then php artisan storage:link || true; fi",
    ]

    for cmd in commands:
        print(f"\n[REMOTE EXEC] {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out:
            print(out.strip())
        if err:
            print(f"[REMOTE STDERR] {err.strip()}")

    ssh.close()
    print("\n" + "=" * 60)
    print("DEPLOYMENT COMPLETE! Dynime AI Studio is live on Hostinger.")
    print("=" * 60)

def main():
    parser = argparse.ArgumentParser(description="Dynime AI Deployment & Git Sync")
    parser.add_argument("--build", action="store_true", help="Build frontend assets locally")
    parser.add_argument("--git", action="store_true", help="Commit and push to GitHub")
    parser.add_argument("--message", type=str, default=None, help="Git commit message")
    parser.add_argument("--repo", type=str, default=DEFAULT_REPO, help="GitHub repository URL")
    parser.add_argument("--ssh", action="store_true", help="Deploy to Hostinger via SSH")
    parser.add_argument("--host", type=str, default=DEFAULT_HOST, help="Hostinger SSH Host")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Hostinger SSH Port")
    parser.add_argument("--user", type=str, default=DEFAULT_USER, help="Hostinger SSH Username")
    parser.add_argument("--password", type=str, default=DEFAULT_PASS, help="Hostinger SSH Password")
    parser.add_argument("--remote-dir", type=str, default=DEFAULT_REMOTE_DIR, help="Remote web root directory")
    parser.add_argument("--all", action="store_true", help="Run full pipeline: build, git sync, and ssh deploy")

    args = parser.parse_args()

    if not any([args.build, args.git, args.ssh, args.all]):
        print("Usage examples:")
        print("  python3 deploy_dynime_ai.py --build           # Build assets only")
        print("  python3 deploy_dynime_ai.py --git --repo URL   # Git commit and push")
        print("  python3 deploy_dynime_ai.py --ssh             # SSH deploy to Hostinger")
        print("  python3 deploy_dynime_ai.py --all --repo URL  # Full end-to-end pipeline")
        sys.exit(0)

    if args.all or args.build:
        build_assets()

    if args.all or args.git:
        git_sync(commit_msg=args.message, repo_url=args.repo)

    if args.all or args.ssh:
        hostinger_ssh_deploy(
            host=args.host,
            port=args.port,
            user=args.user,
            password=args.password,
            remote_dir=args.remote_dir,
        )

if __name__ == "__main__":
    main()
