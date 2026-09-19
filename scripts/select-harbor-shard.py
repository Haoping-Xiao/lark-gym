"""Select a disjoint CI slice using ordinary Harbor job configurations."""
import json,sys
from pathlib import Path
import yaml
index,count=map(int,sys.argv[1:3])
assert 0 <= index < count
names=sorted(p.name for p in Path('tasks').glob('automationbench-*') if p.is_dir())[index::count]
assert names,('empty shard',index,count)
output=Path('runs/harbor');output.mkdir(parents=True,exist_ok=True)
(output/'selected-tasks.json').write_text(json.dumps(names)+'\n')
for agent in ['oracle','nop']:
    config=yaml.safe_load(Path(f'experiments/eval/{agent}.yaml').read_text())
    config['datasets'][0]['task_names']=names
    (output/f'{agent}.yaml').write_text(yaml.safe_dump(config,sort_keys=False))
print(f'Shard {index+1}/{count}: {len(names)} tasks')
