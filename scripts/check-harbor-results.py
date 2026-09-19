"""Fail CI on missing trials, infrastructure errors, or unexpected rewards."""
import json, sys
from pathlib import Path
job=Path(sys.argv[1]);expected=int(sys.argv[2])
tasks={p.name for p in Path('tasks').glob('automationbench-*') if p.is_dir()}
seen=set()
for p in job.glob('*/result.json'):
    result=json.loads(p.read_text());name=result['task_name'].split('/')[-1]
    assert name in tasks and name not in seen,(p,name)
    assert not result.get('exception_info'),(p,result.get('exception_info'))
    reward=(result.get('verifier_result') or {}).get('rewards')
    assert reward and all(value==expected for value in reward.values()),(p,reward)
    seen.add(name)
assert seen==tasks,{'missing':sorted(tasks-seen),'unexpected':sorted(seen-tasks)}
print(f'{len(seen)} Harbor trials verified with reward {expected}')
