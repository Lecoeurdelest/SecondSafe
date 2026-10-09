#!/usr/bin/env python3
"""Validate Gitflow routes, local commits and task scope."""

import argparse
import re
import subprocess
from pathlib import Path

IDENTITY = 'Lecoeurdelest <116455158+Lecoeurdelest@users.noreply.github.com>'
FEATURE = re.compile(r'codex/feature/task-(\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*')
RELEASE = re.compile(r'codex/release/[a-z0-9][a-z0-9.-]*')
HOTFIX = re.compile(r'codex/hotfix/[a-z0-9]+(?:-[a-z0-9]+)*')


def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()


def role(branch):
    if branch in ('main', 'develop'):
        return branch
    for kind, pattern in (('feature', FEATURE), ('release', RELEASE), ('hotfix', HOTFIX)):
        if pattern.fullmatch(branch):
            return kind
    return 'invalid'


def validate_route(head, base, allow_stacked=False):
    source, target = role(head), role(base)
    allowed = {
        'main': {'release', 'hotfix'},
        'develop': {'feature', 'release', 'hotfix', 'main'},
    }.get(target, set())
    if allow_stacked and target == 'feature':
        allowed = {'feature'}
    if source not in allowed or head == base:
        raise ValueError(f'Gitflow rejects {head} -> {base}.')


def validate_subject(subject, branch):
    if not subject.strip():
        raise ValueError('Commit subject is empty.')
    match = FEATURE.fullmatch(branch)
    if match and set(re.findall(r'TASK-\d{3}', subject)) != {'TASK-' + match[1]}:
        raise ValueError(f'Commit must reference only TASK-{match[1]}: {subject}')


def check_local(message_file=None):
    branch = git('branch', '--show-current')
    if role(branch) not in ('feature', 'release', 'hotfix'):
        raise ValueError('Commit on a named codex/feature, codex/release or codex/hotfix branch.')
    for variable in ('GIT_AUTHOR_IDENT', 'GIT_COMMITTER_IDENT'):
        if git('var', variable).partition('>')[0] + '>' != IDENTITY:
            raise ValueError(f'{variable} must use {IDENTITY}.')
    merging = Path(git('rev-parse', '--git-path', 'MERGE_HEAD')).exists()
    if message_file and not merging:
        text = Path(message_file).read_text(encoding='utf-8')
        validate_subject(text.splitlines()[0] if text else '', branch)


def check_pr(head_branch, base_branch, base, head, allow_stacked=False):
    validate_route(head_branch, base_branch, allow_stacked)
    commits = git('rev-list', '--no-merges', f'{base}..{head}').splitlines()
    if role(head_branch) == 'feature':
        for commit in commits:
            validate_subject(git('show', '-s', '--format=%s', commit), head_branch)
    return len(commits)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--local', action='store_true')
    parser.add_argument('--message-file')
    parser.add_argument('--head-branch')
    parser.add_argument('--base-branch')
    parser.add_argument('--base')
    parser.add_argument('--head', default='HEAD')
    parser.add_argument('--allow-stacked', action='store_true')
    args = parser.parse_args()
    try:
        if args.local:
            check_local(args.message_file)
            print('PASS: local Gitflow branch, identity and commit scope')
        else:
            if not all((args.head_branch, args.base_branch, args.base)):
                parser.error('PR checks require --head-branch, --base-branch and --base.')
            count = check_pr(args.head_branch, args.base_branch, args.base, args.head, args.allow_stacked)
            print(f'PASS: {args.head_branch} -> {args.base_branch}; {count} task commits')
    except (ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'FAIL: {error}\n')


if __name__ == '__main__':
    main()
