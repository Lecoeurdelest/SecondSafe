#!/usr/bin/env python3
"""Record verification evidence for one task and update its execution record.

Usage (from the repository root): python3 verify-runner.py <verify-input.json>

The input file names the task, the checks to run and, for every acceptance criterion, the result
its author observed and where. This script runs the checks, keeps their original output next to
itself, updates .project/state.json, regenerates the views and writes report.json.

Environment:
  VERIFIER                 directory holding node_modules/eslint and eslint-plugin-sonarjs
  INTEGRATION_MONGODB_URI  disposable MongoDB replica set for integration-runner.js
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

root = Path.cwd()
spec = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
task_id = spec['task_id']
ev = root / '.project' / 'evidence' / task_id / spec['run']
rel = lambda name: str((ev / name).relative_to(root))
model = yaml.safe_load((root / 'project.yaml').read_text(encoding='utf-8'))
task = next(t for t in model['tasks'] if t['id'] == task_id)
criteria = {c['id']: c for r in model['requirements'] for c in r['acceptance']}
assert set(spec['criteria']) == set(task['acceptance_ids']), 'criteria do not match the task'
assert not (ev / 'report.json').exists(), 'Evidence is append-only; choose a new run'
PY = sys.executable


def run(name, command, cwd=root, expected=(0,), shown=None, env=None):
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, env={**os.environ, **(env or {})})
    output = 'Command: ' + (shown or ' '.join(command)) + '\n' + result.stdout + result.stderr + f'\nexit_code={result.returncode}\n'
    (ev / name).write_text(output, encoding='utf-8')
    assert result.returncode in expected, output[-4000:]
    print(f'{name}: exit {result.returncode}')
    return result


behavioral, static, manual = [], [], []
if spec['kind'] == 'backend':
    run('jest.txt', ['npm', 'test'], root / 'backend')
    behavioral.append(rel('jest.txt'))
    if spec.get('sections'):
        sections = ','.join(spec['sections'])
        run('integration.txt', ['node', rel('integration-runner.js'), 'backend', sections],
            shown=f"node {rel('integration-runner.js')} backend {sections}")
        behavioral.append(rel('integration.txt'))
    if spec.get('complexity'):
        verifier = os.environ['VERIFIER']
        shutil.copyfile(Path(verifier) / 'package-lock.json', ev / 'analyzer-package-lock.json')
        rules = ['--rule', 'complexity: [error, 10]', '--rule', 'max-depth: [error, 3]', '--rule', 'sonarjs/cognitive-complexity: [error, 15]']
        options = ['--no-eslintrc', '--env', 'node,es2022', '--parser-options', '{"ecmaVersion":2022}', '--plugin', 'sonarjs']
        run('complexity.txt', ['node', f'{verifier}/node_modules/eslint/bin/eslint.js', *options, '--resolve-plugins-relative-to', verifier, *rules, *spec['complexity']],
            shown='node $VERIFIER/node_modules/eslint/bin/eslint.js ' + ' '.join(options) + ' --resolve-plugins-relative-to $VERIFIER '
                  + ' '.join(f'"{r}"' if ':' in r else r for r in rules) + ' ' + ' '.join(spec['complexity']))
        static.append(rel('complexity.txt'))
else:
    run('frontend-test.txt', ['npm', 'test', '--', '--watchAll=false', '--runInBand'], root / 'frontend', env={'CI': 'true'})
    run('frontend-build.txt', ['npm', 'run', 'build'], root / 'frontend', env={'CI': 'true'})
    behavioral += [rel('frontend-test.txt'), rel('frontend-build.txt')]
if spec.get('flow'):
    (ev / 'flow-review.md').write_text('# Flow review\n\n' + spec['flow'].strip() + '\n', encoding='utf-8')
    static.append(rel('flow-review.md'))
if spec.get('manual'):
    (ev / 'manual-review.md').write_text('# Manual review\n\n' + spec['manual'].strip() + '\n', encoding='utf-8')
    manual.append(rel('manual-review.md'))

# ---- execution record -----------------------------------------------------------------------------
state_path = root / '.project' / 'state.json'
state = json.loads(state_path.read_text(encoding='utf-8'))
record = state['tasks'][task_id]
status_of = lambda item: 'fail' if item['observed'] == 'fail' else 'inconclusive'
record.update(execution=spec['execution'], detail=spec['detail'], evidence=[rel('report.json')],
              implementation=f'docs/implement/IMPL-{task_id}.md',
              criteria={cid: status_of(item) for cid, item in spec['criteria'].items()})
history = record.setdefault('history', [])
for execution, note in spec['history']:
    history.append({'date': spec['date'], 'execution': execution, 'note': note})
state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

run('render.txt', [PY, 'tools/pdd/render.py'], shown='python3 tools/pdd/render.py')
checker = 'tools/plan-driven-development/scripts/check_project.py'
run('validate.txt', [PY, checker, 'validate', 'project.yaml'], shown=f'python3 {checker} validate project.yaml')
audit = subprocess.run([PY, checker, 'audit-preservation', 'project.yaml', '--root', '.'], capture_output=True, text=True, cwd=root)
assert audit.returncode == 0, audit.stdout[-2000:]
full = json.loads(audit.stdout)
(ev / 'preservation-summary.json').write_text(json.dumps({
    'command': f'python3 {checker} audit-preservation project.yaml --root .', 'exit_code': audit.returncode,
    'status': full['status'], 'errors': full['errors'], 'warnings': full['warnings'], 'checked_entries': len(full['checked'])}, indent=2) + '\n')
run('status.txt', [PY, checker, 'audit-task-status', 'docs/task/README.md'], shown=f'python3 {checker} audit-task-status docs/task/README.md')
run('generated-views.txt', [PY, 'tools/pdd/render.py', '--check'], shown='python3 tools/pdd/render.py --check')
run('migration-index.txt', [PY, 'tools/pdd/check-migration.py'], shown='python3 tools/pdd/check-migration.py')

# ---- inputs this evidence is valid for ------------------------------------------------------------
side = 'backend' if spec['kind'] == 'backend' else 'frontend'
paths = {root / 'project.yaml', root / 'plan.md', root / side / 'package.json', root / side / 'package-lock.json',
         *(p for p in (root / side / 'src').rglob('*') if p.is_file()),
         *(p for p in ev.iterdir() if p.name in ('verify-runner.py', 'verify-input.json', 'integration-runner.js', 'analyzer-package-lock.json'))}
if side == 'backend':
    paths |= {root / 'backend' / '.env.example', *(root / 'backend' / 'tests').rglob('*.js')}
manifest = ''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + str(p.relative_to(root)) + '\n' for p in sorted(paths))
(ev / 'source-manifest.txt').write_text(manifest)

artifacts = {'behavioral_test': behavioral, 'static_flow': static or behavioral, 'manual_review': manual or behavioral}
records = []
for cid in task['acceptance_ids']:
    item = spec['criteria'][cid]
    default = 'pass' if item['observed'] == 'pass' else 'fail' if item['observed'] == 'fail' else 'inconclusive'
    records.append({
        'id': cid, 'status': status_of(item), 'observed_behavioral_status': item['observed'], 'observation': item['note'],
        'confidence': None, 'confidence_reason': 'Applicable calibrated alignment evaluator is unavailable',
        'analysis_complete': item['observed'] != 'not_observed',
        'checks': [{'method': method, 'status': item['checks'].get(method, default), 'artifacts': artifacts[method]}
                   for method in criteria[cid]['verification']]})
failed = any(r['status'] == 'fail' for r in records)
report = {
    'schema_version': 1, 'task_id': task_id,
    'spec_hash': hashlib.sha256((root / 'project.yaml').read_bytes()).hexdigest(),
    'source_hash': hashlib.sha256(manifest.encode()).hexdigest(),
    'outcome': 'fail' if failed else 'inconclusive',
    'completion_policy': 'Automatic code gate evaluated; applicable calibration or an explicitly accepted manual policy amendment is required for completion',
    'calibration': {'status': 'unavailable', 'id': None, 'artifact': None, 'evaluator_version': None, 'applicable': False},
    'limitations': spec['limitations'], 'criteria': records}
(ev / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
run('automatic-gate.txt', [PY, checker, 'gate', 'project.yaml', rel('report.json'), '--task', task_id, '--source-hash', report['source_hash']],
    expected=(1, 2), shown=f"python3 {checker} gate project.yaml {rel('report.json')} --task {task_id} --source-hash {report['source_hash']}")
print(f"{task_id} recorded: {spec['execution']}; outcome {report['outcome']}")
