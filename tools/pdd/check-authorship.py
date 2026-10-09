#!/usr/bin/env python3
"""Check only commits introduced by a task PR, preserving historical authorship."""
import argparse
import re
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', required=True)
parser.add_argument('--head', default='HEAD')
parser.add_argument('--pr-author', required=True)
args = parser.parse_args()
expected = 'Lecoeurdelest <116455158+Lecoeurdelest@users.noreply.github.com>'
assert args.pr_author == 'Lecoeurdelest', f'Unexpected PR author: {args.pr_author}'
commits = subprocess.check_output(['git', 'rev-list', f'{args.base}..{args.head}'], text=True).splitlines()
for sha in commits:
    identity = subprocess.check_output(['git', 'show', '-s', '--format=%an <%ae>%n%cn <%ce>', sha], text=True).splitlines()
    assert identity == [expected, expected], f'{sha}: unexpected author or committer: {identity}'
    message = subprocess.check_output(['git', 'show', '-s', '--format=%B', sha], text=True)
    assert not re.search(r'(?im)^(co-authored-by|signed-off-by|generated (with|by))\s*:?', message), f'{sha}: attribution footer'
print(f'PASS: PR author Lecoeurdelest; {len(commits)} new commits have the sole authorized author and committer')
