#!/usr/bin/env python3
"""Validate migration coverage and remote tracking without changing execution state."""
import json
from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[2]
model = yaml.safe_load((root / 'project.yaml').read_text())
state = json.loads((root / '.project/state.json').read_text())
tasks = {t['id']: t for t in model['tasks']}
assert len(tasks) == len(model['tasks']), 'duplicate task ID'
assert all(f'TASK-{n:03d}' in tasks for n in range(1, 74)), 'missing baseline/migration task'
assert set(tasks) == set(state['tasks']), 'execution state differs from task definitions'
assert next(d for d in model['decisions'] if d['id'] == 'D-009')['status'] == 'accepted'
for n in range(53, 74):
    task = tasks[f'TASK-{n:03d}']
    for key in ('objective', 'in_scope', 'out_of_scope', 'inputs', 'outputs', 'acceptance_ids', 'verification_commands'):
        assert task[key], f'{task["id"]}: missing {key}'
    assert all(d in tasks for d in task['depends_on']), f'{task["id"]}: unknown dependency'
    assert (root / 'docs/task' / f'{task["id"]}.md').exists(), 'missing task specification'
delivery_path = root / '.project/delivery.json'
if delivery_path.exists():
    delivery = json.loads(delivery_path.read_text())
    assert delivery['repository'] == 'Lecoeurdelest/SecondSafe'
    for tid, links in delivery['tasks'].items():
        assert tid in tasks, f'unknown remote task {tid}'
        for kind in ('issue', 'pr'):
            if kind in links:
                prefix = 'issues' if kind == 'issue' else 'pull'
                assert links[kind].startswith(f'https://github.com/Lecoeurdelest/SecondSafe/{prefix}/')
print(f'PASS: {len(tasks)} unique tasks; 52 existing backend tasks preserved; 21 migration/web/integration tasks indexed')
