from pathlib import Path
import hashlib, json, subprocess, sys, shutil, yaml
root=Path.cwd()
task_id=sys.argv[1]
files=sys.argv[2:]
ev=root/f'.project/evidence/{task_id}/run-02'
assert not ev.exists(), 'Evidence is append-only; choose a new run'
ev.mkdir(parents=True)
shutil.copyfile(__file__,ev/'verify-runner.py')
shutil.copyfile('/tmp/secondsafe-verifier/package-lock.json',ev/'analyzer-package-lock.json')
model=yaml.safe_load((root/'project.yaml').read_text())
task=next(t for t in model['tasks'] if t['id']==task_id)
def run(name, cmd, cwd=root, expected=0):
    r=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True)
    output='Command: '+ ' '.join(cmd)+'\n'+r.stdout+r.stderr+f'\nexit_code={r.returncode}\n'
    (ev/name).write_text(output)
    assert r.returncode==expected,output[-3000:]
    print(name, 'exit',r.returncode)
run('jest.txt',['npm','test'],root/'backend')
run('complexity.txt',['node','/tmp/secondsafe-verifier/node_modules/eslint/bin/eslint.js','--no-eslintrc','--env','node,es2022','--parser-options','{"ecmaVersion":2022}','--resolve-plugins-relative-to','/tmp/secondsafe-verifier','--plugin','sonarjs','--rule','complexity: [error, 10]','--rule','max-depth: [error, 3]','--rule','sonarjs/cognitive-complexity: [error, 15]',*files])
base=(root/'.project/evidence/TASK-005/run-02/ast-runner.js').read_text()
base=base.replace("const root = '/Users/quyn28654/Documents/ChatGPT/wdp/SecondSafe';", "const root = path.resolve(__dirname, '../../../..');")
start=base.index("for (const name of [")
end=base.index("  const source =",start)
base=base[:start]+'for (const file of '+json.dumps(files)+') {\n'+base[end:]
base=base.replace(".project/evidence/TASK-005/run-01/ast-flow.json",str(ev.relative_to(root)/'ast-flow.json'))
(ev/'ast-runner.js').write_text(base)
run('ast-runner.txt',['node',str(ev/'ast-runner.js')])
state_path=root/'.project/state.json';state=json.loads(state_path.read_text());row=state['tasks'][task_id]
row.update(execution='verifying',detail='Behavioral tests and bounded AST/complexity review recorded; automatic completion remains inconclusive without applicable calibration',evidence=[str(ev.relative_to(root)/'report.json')],implementation=f'docs/implement/IMPL-{task_id}.md',criteria={cid:'inconclusive' for cid in task['acceptance_ids']})
row.setdefault('history',[]).append({'date':'2026-10-09','execution':'verifying','note':row['detail']})
state_path.write_text(json.dumps(state,indent=2,ensure_ascii=False)+'\n')
run('render.txt',['python3','tools/pdd/render.py'])
for name,args in [('validate',['validate','project.yaml']),('preservation',['audit-preservation','project.yaml','--root','.']),('status',['audit-task-status','docs/task/README.md'])]:
    run(name+'.txt',['python3','tools/plan-driven-development/scripts/check_project.py',*args])
    if name=='preservation':
        original=json.loads((ev/(name+'.txt')).read_text().split('\n',1)[1].rsplit('\nexit_code=',1)[0])
        (ev/'preservation-summary.json').write_text(json.dumps({'status':original['status'],'errors':original['errors'],'warnings':original['warnings'],'checked_entries':len(original['checked'])},indent=2)+'\n')
run('generated-views.txt',['python3','tools/pdd/render.py','--check'])
run('migration-index.txt',['python3','tools/pdd/check-migration.py'])
paths=sorted({root/'project.yaml',root/'plan.md',root/'backend/package.json',root/'backend/package-lock.json',root/'backend/.env.example',*root.joinpath('backend/src').rglob('*.js'),*root.joinpath('backend/tests').rglob('*.js'),ev/'verify-runner.py',ev/'ast-runner.js',ev/'analyzer-package-lock.json'})
manifest=''.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+str(f.relative_to(root))+'\n' for f in paths)
(ev/'source-manifest.txt').write_text(manifest)
checks=[{'method':'behavioral_test','status':'pass','artifacts':[str(ev.relative_to(root)/'jest.txt')]},{'method':'static_flow','status':'pass','artifacts':[str(ev.relative_to(root)/name) for name in ['ast-flow.json','complexity.txt','flow-review.md']]}]
report={'schema_version':1,'task_id':task_id,'spec_hash':hashlib.sha256((root/'project.yaml').read_bytes()).hexdigest(),'source_hash':hashlib.sha256(manifest.encode()).hexdigest(),'outcome':'inconclusive','completion_policy':'Automatic code gate evaluated; applicable calibration or an explicitly accepted manual policy amendment is required for completion','calibration':{'status':'unavailable','id':None,'artifact':None,'evaluator_version':None,'applicable':False},'limitations':['Bounded AST inventory supports manual review; it is not a complete formal verifier','No applicable calibrated evaluator exists'],'criteria':[{'id':cid,'status':'inconclusive','observed_behavioral_status':'pass','confidence':None,'confidence_reason':'Applicable calibrated alignment evaluator is unavailable','analysis_complete':True,'checks':checks} for cid in task['acceptance_ids']]}
(ev/'report.json').write_text(json.dumps(report,indent=2)+'\n')
run('automatic-gate.txt',['python3','tools/plan-driven-development/scripts/check_project.py','gate','project.yaml',str(ev/'report.json'),'--task',task_id,'--source-hash',report['source_hash']],expected=2)
print(task_id,'recorded; remains verifying')
