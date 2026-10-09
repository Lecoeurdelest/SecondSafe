#!/usr/bin/env python3
"""Install Gitflow hooks in this repository's shared Git directory."""

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
git_dir = Path(subprocess.check_output(
    ['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], text=True).strip())
destination = git_dir / 'gitflow-hooks'
existing = subprocess.run(['git', 'config', '--get', 'core.hooksPath'], capture_output=True, text=True)
if existing.returncode not in (0, 1):
    raise SystemExit('Cannot read the existing hooks configuration.')
if existing.stdout.strip() and Path(existing.stdout.strip()).resolve() != destination:
    raise SystemExit('Existing core.hooksPath is configured; preserve it and integrate the hooks manually.')
hooks = git_dir / 'hooks'
if not existing.stdout.strip() and any((hooks / name).exists() for name in ('pre-commit', 'commit-msg')):
    raise SystemExit('Existing commit hooks found; preserve them and integrate the Gitflow checks manually.')
destination.mkdir(exist_ok=True)
shutil.copyfile(ROOT / 'tools/pdd/check-gitflow.py', destination / 'check-gitflow.py')
for name, arguments in (('pre-commit', '--local'), ('commit-msg', '--local --message-file "$1"')):
    path = destination / name
    path.write_text('#!/bin/sh\nexec python3 "$(dirname "$0")/check-gitflow.py" ' + arguments + '\n')
    path.chmod(0o755)
subprocess.run(['git', 'config', '--local', 'core.hooksPath', str(destination)], check=True)
print(f'PASS: Gitflow hooks installed at {destination}')
