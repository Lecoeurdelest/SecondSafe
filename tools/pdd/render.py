#!/usr/bin/env python3
"""Render SecondSafe documentation views from project.yaml and .project/state.json.

Usage:
  python3 tools/pdd/render.py            # regenerate all managed views
  python3 tools/pdd/render.py --check    # exit 1 if any managed view is stale
  python3 tools/pdd/render.py bundle TASK-011   # write .project/bundles/TASK-011.md
"""

import argparse
import hashlib
import json
import subprocess
import sys
from collections import OrderedDict
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
MODEL = ROOT / 'project.yaml'
STATE = ROOT / '.project' / 'state.json'
MANIFEST = ROOT / '.project' / 'generated-manifest.json'
PLAN = ROOT / 'plan.md'
GENERATOR = 'tools/pdd/render.py'
TEMPLATE_VERSION = 'plan-driven-development@41c1bd8ec495524656369a95c126bc09bf465896'
MARKERS = {'todo': '[]', 'ready': '[]', 'in_progress': '[!]', 'verifying': '[!]', 'blocked': '[!]',
           'needs_revalidation': '[!]', 'done': '[x]'}
METHOD_LABEL = {'behavioral_test': 'behavioral test', 'static_flow': 'static flow review', 'manual_review': 'manual review',
                'document_check': 'document check', 'device_observation': 'device observation'}
MILESTONES = [('M0', 'Scaffold', 1, 2), ('M1', 'Platform and identity', 3, 16), ('M2', 'Catalog and chat', 17, 23),
              ('M3', 'Money and orders', 24, 36), ('M4', 'Trust and moderation', 37, 43),
              ('M5', 'Administration and operations', 44, 52),
              ('M6', 'Migration control', 53, 53), ('M7', 'Web client', 54, 72),
              ('M8', 'Full-stack integration', 73, 73)]
FR_GROUPS = OrderedDict([
    ('AUTH', 'Identity and access'), ('PROF', 'Profiles'), ('PROD', 'Listings'), ('BROW', 'Browse and search'),
    ('FAV', 'Favorites'), ('CHAT', 'Chat and negotiation'), ('ORD', 'Orders'), ('PAY', 'Wallet, payments and escrow'),
    ('SHIP', 'Delivery'), ('REV', 'Reviews'), ('RPT', 'Violation reports'), ('DSP', 'Disputes'), ('NOTI', 'Notifications'),
    ('MOD', 'Moderation'), ('ADM', 'Administration'), ('SYS', 'Scheduled jobs and data operations'),
    ('WEB', 'Web client migration'),
])
PROGRESS_BEGIN = '<!-- BEGIN GENERATED: progress -->'
PROGRESS_END = '<!-- END GENERATED: progress -->'


def sha256(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode('utf-8')).hexdigest()


def load():
    model = yaml.safe_load(MODEL.read_text(encoding='utf-8'))
    state = json.loads(STATE.read_text(encoding='utf-8'))
    return model, state


def milestone(task_id):
    number = int(task_id.split('-')[1])
    for code, title, first, last in MILESTONES:
        if first <= number <= last:
            return code, title
    return '—', ''


def criterion_index(model):
    index = {}
    for requirement in model['requirements']:
        for criterion in requirement['acceptance']:
            index[criterion['id']] = (requirement, criterion)
    return index


def tasks_by_criterion(model):
    owners = {}
    for task in model['tasks']:
        for cid in task['acceptance_ids']:
            owners[cid] = task['id']
    return owners


def task_record(state, task_id):
    return state['tasks'].get(task_id, {'execution': 'todo', 'relevance': 'current', 'detail': ''})


def methods(criterion):
    return ', '.join(METHOD_LABEL.get(m, m) for m in criterion['verification'])


def render_requirement(requirement, owners, state):
    lines = [f"### {requirement['id']} — {requirement['title']}", '']
    meta = [f"Risk: `{requirement['risk']}`", f"Component: `{requirement['component']}`",
            f"Source: `{requirement['source']['file']}` § {requirement['source']['section']}"]
    if requirement.get('status'):
        meta.append(f"Status: **{requirement['status']}**")
    lines.append(' · '.join(meta))
    lines.append('')
    if requirement.get('deferral_reason'):
        lines += [f"> {requirement['deferral_reason']}", '']
    if requirement.get('baseline_api'):
        lines.append('Baseline: ' + ', '.join(f'`{item}`' for item in requirement['baseline_api']))
        lines.append('')
    lines += ['| Criterion | Statement | Verification | Task |', '|---|---|---|---|']
    for criterion in requirement['acceptance']:
        owner = owners.get(criterion['id'])
        if owner:
            marker = MARKERS[task_record(state, owner)['execution']]
            task_cell = f"[{owner}](../task/{owner}.md) `{marker}`"
        else:
            task_cell = '—'
        statement = criterion['statement'].replace('|', '\\|')
        lines.append(f"| `{criterion['id']}` | {statement} | {methods(criterion)} | {task_cell} |")
    lines.append('')
    return lines


def render_requirements(model, state):
    owners = tasks_by_criterion(model)
    outputs = {}
    functional = [r for r in model['requirements'] if r['kind'] == 'functional']
    quality = [r for r in model['requirements'] if r['kind'] == 'non_functional']
    index = ['# Requirements', '', 'Generated from `project.yaml` by `tools/pdd/render.py`. Edit the model, not this file.', '',
             'IDs come from the Project Tracking workbook (BASE-TRACKING) and are never renumbered.', '',
             '| File | Scope | Requirements | Criteria |', '|---|---|---|---|']
    for code, title in FR_GROUPS.items():
        group = [r for r in functional if r['id'].split('-')[1] == code]
        if not group:
            continue
        name = f'FR-{code}.md'
        body = [f'# FR-{code} — {title}', '', 'Generated from `project.yaml`. Edit the model, not this file.', '']
        for requirement in group:
            body += render_requirement(requirement, owners, state)
        outputs[f'docs/requirements/{name}'] = '\n'.join(body).rstrip() + '\n'
        index.append(f"| [{name}]({name}) | {title} | {len(group)} | {sum(len(r['acceptance']) for r in group)} |")
    body = ['# NFR — Quality requirements', '', 'Generated from `project.yaml`. Edit the model, not this file.', '']
    for requirement in quality:
        body += render_requirement(requirement, owners, state)
    outputs['docs/requirements/NFR.md'] = '\n'.join(body).rstrip() + '\n'
    index.append(f"| [NFR.md](NFR.md) | Quality requirements | {len(quality)} | {sum(len(r['acceptance']) for r in quality)} |")
    index.append('')
    outputs['docs/requirements/README.md'] = '\n'.join(index)
    return outputs


def cell(text):
    return str(text).replace('|', '\\|').replace('\n', ' ')


def render_task_index(model, state):
    decisions = {d['id']: d for d in model['decisions']}
    delivery_path = ROOT / '.project' / 'delivery.json'
    delivery = json.loads(delivery_path.read_text()) if delivery_path.exists() else {'tasks': {}}
    lines = ['# Tasks', '',
             'This index is generated from `.project/state.json` and `project.yaml` by `tools/pdd/render.py`. '
             'Update the execution record first; never hand-edit a marker.', '',
             '## Status legend', '',
             '- `[]` — `todo` or `ready`',
             '- `[!]` — `in_progress`, `verifying`, `blocked`, or `needs_revalidation`',
             '- `[x]` — `done` with current evidence', '',
             '## Status', '',
             '| Status | ID | Title | Execution | Relevance | Milestone | Depends on | Detail | Evidence | Delivery |',
             '|---|---|---|---|---|---|---|---|---|---|']
    for task in model['tasks']:
        record = task_record(state, task['id'])
        marker = MARKERS[record['execution']]
        deps = ', '.join(task['depends_on']) or '—'
        evidence = ', '.join(f'[{Path(e).parent.name}](../../{e})' for e in record.get('evidence', [])) or '—'
        remote = delivery['tasks'].get(task['id'], {})
        links = [f'[{kind.upper()}]({remote[kind]})' for kind in ('issue', 'pr') if remote.get(kind)]
        links.extend(f'[PR slice {i}]({url})' for i, url in enumerate(remote.get('supporting_prs', []), 1))
        lines.append(f"| {marker} | [{task['id']}]({task['id']}.md) | {cell(task['title'])} | `{record['execution']}` | "
                     f"`{record['relevance']}` | {milestone(task['id'])[0]} | {deps} | {cell(record.get('detail') or '—')} | {evidence} | {', '.join(links) or '—'} |")
    lines += ['', '## Milestones', '', '| Milestone | Tasks | Done |', '|---|---|---|']
    for code, title, first, last in MILESTONES:
        ids = [f'TASK-{n:03d}' for n in range(first, last + 1)]
        done = sum(1 for i in ids if task_record(state, i)['execution'] == 'done')
        lines.append(f'| {code} {title} | TASK-{first:03d} … TASK-{last:03d} | {done}/{len(ids)} |')
    pending = [d for d in model['decisions'] if d['status'] == 'proposed']
    lines += ['', '## Open decisions', '', '| Decision | Question | Recommendation | Blocks |', '|---|---|---|---|']
    for decision in pending:
        blocked = [t['id'] for t in model['tasks'] if decision['id'] in t['decision_ids']]
        lines.append(f"| {decision['id']} | {cell(decision['title'])} | {cell(decision.get('recommendation', '—'))} | "
                     f"{', '.join(blocked) or 'none'} |")
    lines.append('')
    return '\n'.join(lines)


def render_task_spec(model, state, task):
    criteria = criterion_index(model)
    decisions = {d['id']: d for d in model['decisions']}
    invariants = {i['id']: i['statement'] for i in model['invariants']}
    record = task_record(state, task['id'])
    results = record.get('criteria', {})
    front = ['---', f"id: {task['id']}", f"title: {task['title']}", f"execution_status: {record['execution']}",
             f"relevance: {record['relevance']}", f"depends_on: [{', '.join(task['depends_on'])}]",
             f"supersedes: [{', '.join(record.get('supersedes', []))}]", f"superseded_by: {record.get('superseded_by') or 'null'}", '---', '']
    lines = front + [f"# {task['id']} — {task['title']}", '',
                     '> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.', '']
    if record['execution'] != 'todo' and record.get('detail'):
        lines += [f"**Current state:** `{record['execution']}` — {record['detail']}", '']
    lines += ['## Traceability', '', '| Field | Value |', '|---|---|',
              '| Requirements | ' + ', '.join(f"[{r}](../requirements/{requirement_file(r)}#{anchor(model, r)})" for r in task['requirement_ids']) + ' |',
              '| Acceptance criteria | ' + ', '.join(f'`{c}`' for c in task['acceptance_ids']) + ' |',
              '| Components | ' + ', '.join(f'`{c}`' for c in task['component_ids']) + ' |',
              '| Decisions | ' + ', '.join(f"`{d}` ({decisions[d]['status']})" for d in task['decision_ids']) + ' |',
              f"| Milestone | {' '.join(milestone(task['id']))} |",
              '| Baseline references | ' + (', '.join(f'`{b}`' for b in task.get('baseline_refs', [])) or '—') + ' |', '',
              '## Objective', '', task['objective'], '', '## In scope', '']
    lines += [f'- {item}' for item in task['in_scope']] + ['', '## Out of scope', '']
    lines += [f'- {item}' for item in task['out_of_scope']] + ['', '## Inputs and dependencies', '']
    lines += [f'- {item}' for item in task['inputs']] + ['']
    lines += ['## Technical approach', '', task.get('technical_approach') or
              'Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.', '']
    lines += ['## Files and symbols', ''] + [f'- `{item}`' for item in task['outputs']] + ['']
    lines += ['## Invariants and constraints', '']
    lines += [f'- `{i}` — {invariants[i]}' for i in task['invariants']] or ['- None beyond the global rules in plan.md §6.']
    lines += ['', '## Acceptance criteria and verification', '']
    for cid in task['acceptance_ids']:
        requirement, criterion = criteria[cid]
        box = '[x]' if results.get(cid) == 'pass' else '[ ]'
        lines.append(f"- {box} `{cid}` ({requirement['id']}) — {criterion['statement']} Verify with: {methods(criterion)}; "
                     f"`{'`, `'.join(task['verification_commands'])}`.")
    lines += ['', '## Required evidence', '',
              f"- Original runner output under `.project/evidence/{task['id']}/<run-id>/` and a `report.json` listing each criterion.",
              f"- Implementation record `docs/implement/IMPL-{task['id']}.md`.", '', '## Stop conditions', '']
    lines += [f'- {item}' for item in task['stop_conditions']]
    lines += ['', '## Completion', '',
              '1. Run the listed checks and keep their original outputs.',
              '2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.',
              '3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.', '']
    return '\n'.join(lines)


def requirement_file(rid):
    if rid.startswith('NFR-'):
        return 'NFR.md'
    return f"FR-{rid.split('-')[1]}.md"


def anchor(model, rid):
    title = next(r['title'] for r in model['requirements'] if r['id'] == rid)
    text = f'{rid} — {title}'.lower()
    keep = []
    for ch in text:
        if ch.isalnum() or ch in '-_ ':
            keep.append(ch)
    return ''.join(keep).replace(' ', '-')


def render_data_model():
    try:
        raw = subprocess.run(['node', str(ROOT / 'tools' / 'pdd' / 'schema-dump.js')], check=True, capture_output=True, text=True).stdout
    except (OSError, subprocess.CalledProcessError) as exc:
        print(f'warning: data-model.md kept as is ({exc.__class__.__name__}); run `npm install` in backend/ to regenerate it', file=sys.stderr)
        return None
    models = json.loads(raw)
    lines = ['# Data model', '',
             'Generated from the Mongoose schemas by `tools/pdd/schema-dump.js` and `tools/pdd/render.py`. '
             'The schemas are the accepted database contract (D-003); change them only through an explicit task with a migration note.', '',
             '| Model | Collection | Schema file | Fields | Indexes |', '|---|---|---|---|---|']
    for m in models:
        lines.append(f"| [{m['name']}](#{m['name'].lower()}) | `{m['collection']}` | `{m['file']}` | {len(m['fields'])} | {len(m['indexes'])} |")
    for m in models:
        lines += ['', f"## {m['name']}", '', f"Collection `{m['collection']}` · `{m['file']}`", '',
                  '| Field | Type | Required | Constraints |', '|---|---|---|---|']
        for f in m['fields']:
            constraints = []
            if 'enum' in f:
                constraints.append('enum: ' + ', '.join(f'`{v}`' for v in f['enum']))
            if 'ref' in f:
                constraints.append(f"ref → `{f['ref']}`")
            for key in ('min', 'max', 'minlength', 'maxlength'):
                if key in f:
                    constraints.append(f'{key} {f[key]}')
            if f.get('unique'):
                constraints.append('unique')
            if 'default' in f:
                constraints.append(f"default `{json.dumps(f['default'], ensure_ascii=False)}`")
            lines.append(f"| `{f['path']}` | {f['type']} | {'yes' if f.get('required') else ''} | {cell('; '.join(constraints))} |")
        lines += ['', '| Index | Options |', '|---|---|']
        for index in m['indexes']:
            options = ', '.join(f'{k}: {json.dumps(v)}' for k, v in index['options'].items() if k != 'background') or '—'
            lines.append(f"| `{json.dumps(index['key'])}` | {options} |")
    lines.append('')
    return '\n'.join(lines)


def render_progress(model, state):
    total = len(model['tasks'])
    counts = OrderedDict((k, 0) for k in ('done', 'in_progress', 'verifying', 'blocked', 'needs_revalidation', 'ready', 'todo'))
    for task in model['tasks']:
        counts[task_record(state, task['id'])['execution']] += 1
    summary = ', '.join(f'{v} {k}' for k, v in counts.items() if v)
    active = [r for r in model['requirements'] if not r.get('status')]
    return '\n'.join([PROGRESS_BEGIN,
                      f"**Progress (generated):** {counts['done']}/{total} tasks done ({summary}). "
                      f"{len(active)} active requirements, {sum(len(r['acceptance']) for r in active)} acceptance criteria. "
                      'See [docs/task/README.md](docs/task/README.md).',
                      PROGRESS_END])


def render_agent_index(model, outputs):
    index = {
        'project': model['project']['id'],
        'authorities': {
            'intent': 'plan.md',
            'model': 'project.yaml',
            'execution_state': '.project/state.json',
            'evidence': '.project/evidence/',
            'implementation_records': 'docs/implement/',
        },
        'read_first': ['.agent/AGENTS.md', 'plan.md', 'docs/task/README.md', 'docs/technical/architecture.md'],
        'generated_views': sorted(outputs),
        'tasks': {t['id']: f"docs/task/{t['id']}.md" for t in model['tasks']},
    }
    return json.dumps(index, indent=2, ensure_ascii=False) + '\n'


def build_outputs(model, state):
    outputs = OrderedDict()
    outputs.update(render_requirements(model, state))
    outputs['docs/task/README.md'] = render_task_index(model, state)
    for task in model['tasks']:
        outputs[f"docs/task/{task['id']}.md"] = render_task_spec(model, state, task)
    data_model = render_data_model()
    existing = ROOT / 'docs' / 'technical' / 'data-model.md'
    if data_model is None and existing.exists():
        data_model = existing.read_text(encoding='utf-8')
    if data_model is not None:
        outputs['docs/technical/data-model.md'] = data_model
    outputs['.agent/index.json'] = render_agent_index(model, list(outputs) + ['.agent/index.json', 'plan.md#progress'])
    return outputs


def splice_progress(model, state):
    text = PLAN.read_text(encoding='utf-8')
    start, end = text.index(PROGRESS_BEGIN), text.index(PROGRESS_END) + len(PROGRESS_END)
    return text[:start] + render_progress(model, state) + text[end:]


def manifest(model_bytes, state_bytes, outputs, plan_text):
    schema_inputs = sorted(str(p.relative_to(ROOT)) for p in (ROOT / 'backend' / 'src' / 'modules').glob('*/*.model.js'))
    return json.dumps({
        'generator': GENERATOR,
        'template_version': TEMPLATE_VERSION,
        'inputs': {
            'project.yaml': sha256(model_bytes),
            '.project/state.json': sha256(state_bytes),
            **({'.project/delivery.json': sha256((ROOT / '.project/delivery.json').read_bytes())}
               if (ROOT / '.project/delivery.json').exists() else {}),
            **{p: sha256((ROOT / p).read_bytes()) for p in schema_inputs},
        },
        'outputs': {path: {'ownership': 'generated', 'sha256': sha256(content)} for path, content in outputs.items()},
        'managed_regions': {'plan.md': {'region': 'progress', 'sha256': sha256(render_progress_from(plan_text))}},
    }, indent=2) + '\n'


def render_progress_from(plan_text):
    start, end = plan_text.index(PROGRESS_BEGIN), plan_text.index(PROGRESS_END) + len(PROGRESS_END)
    return plan_text[start:end]


def bundle(model, state, task_id):
    task = next((t for t in model['tasks'] if t['id'] == task_id), None)
    if task is None:
        sys.exit(f'unknown task {task_id}')
    record = task_record(state, task_id)
    unfinished = [d for d in task['depends_on'] if task_record(state, d)['execution'] != 'done']
    decisions = {d['id']: d for d in model['decisions']}
    lines = [f'# Bundle {task_id}', '',
             f"Model snapshot: project.yaml sha256 `{sha256(MODEL.read_bytes())}`", '',
             f"Execution: `{record['execution']}` · Unfinished dependencies: {', '.join(unfinished) or 'none'}", '',
             '## Decisions', ''] + [f"- `{d}` {decisions[d]['status']}: {decisions[d]['title']}" for d in task['decision_ids']] + ['']
    lines.append(render_task_spec(model, state, task))
    path = ROOT / '.project' / 'bundles' / f'{task_id}.md'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(lines), encoding='utf-8')
    print(path.relative_to(ROOT))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true')
    sub = parser.add_subparsers(dest='command')
    b = sub.add_parser('bundle')
    b.add_argument('task_id')
    args = parser.parse_args()
    model, state = load()
    if args.command == 'bundle':
        bundle(model, state, args.task_id)
        return 0
    outputs = build_outputs(model, state)
    plan_text = splice_progress(model, state)
    manifest_text = manifest(MODEL.read_bytes(), STATE.read_bytes(), outputs, plan_text)
    targets = dict(outputs)
    targets['plan.md'] = plan_text
    targets['.project/generated-manifest.json'] = manifest_text
    stale = [p for p, c in targets.items() if not (ROOT / p).exists() or (ROOT / p).read_text(encoding='utf-8') != c]
    if args.check:
        for path in stale:
            print(f'stale: {path}')
        return 1 if stale else 0
    for path in stale:
        target = ROOT / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(targets[path], encoding='utf-8')
    print(f'updated {len(stale)} file(s)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
