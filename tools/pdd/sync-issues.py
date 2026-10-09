#!/usr/bin/env python3
"""Create missing task issues as Lecoeurdelest; persist each URL before continuing."""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[2]
REPO = 'Lecoeurdelest/SecondSafe'


def gh(*args):
    return subprocess.check_output(['gh', *args], text=True).strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Create missing GitHub issues')
    args = parser.parse_args()
    assert gh('api', 'user', '--jq', '.login') == 'Lecoeurdelest', 'Wrong GitHub identity'
    model = yaml.safe_load((ROOT / 'project.yaml').read_text())
    target = ROOT / '.project/delivery.json'
    delivery = json.loads(target.read_text()) if target.exists() else {
        'schema_version': 1, 'repository': REPO, 'author': 'Lecoeurdelest', 'tasks': {}}
    existing = json.loads(gh('issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '500', '--json', 'title,url,author'))
    for task in model['tasks']:
        tid = task['id']
        title = f'{tid}: {task["title"]}'
        known = next((issue for issue in existing if issue['title'].startswith(f'{tid}:')), None)
        links = delivery['tasks'].setdefault(tid, {})
        if known:
            links['issue'] = known['url']
        if links.get('issue'):
            continue
        if not args.apply:
            print(f'would create {title}', flush=True)
            continue
        body = (f'Task specification: `docs/task/{tid}.md`\n\n'
                f'{task["objective"]}\n\n'
                'Dependencies: ' + (', '.join(task['depends_on']) or 'none') + '\n\n'
                'Track implementation, original verification evidence and the dedicated task PR here. '
                'Execution state is maintained in `.project/state.json`; see the generated task index. '
                'Feature PRs follow `docs/technical/gitflow.md`.\n\n'
                + (ROOT / 'docs/task' / f'{tid}.md').read_text())
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md') as temp:
            temp.write(body)
            temp.flush()
            links['issue'] = gh('issue', 'create', '--repo', REPO, '--title', title, '--body-file', temp.name)
        target.write_text(json.dumps(delivery, indent=2) + '\n')
        print(f'{tid} {links["issue"]}', flush=True)
    if args.apply:
        target.write_text(json.dumps(delivery, indent=2) + '\n')
    print(f'Tracked {sum(bool(t.get("issue")) for t in delivery["tasks"].values())} task issues', flush=True)


if __name__ == '__main__':
    main()
