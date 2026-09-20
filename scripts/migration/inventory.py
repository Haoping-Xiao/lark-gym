"""Inspect upstream task builders without loading the evaluation/Arrow stack.
Only replace Dataset.from_list (the final serialization sink); execute the
original task builder and deterministic noise code unchanged.
"""
import importlib
import json
import sys
import types
from pathlib import Path
if len(sys.argv) != 3:
    raise SystemExit('Usage: inventory.py UPSTREAM_REPOSITORY OUTPUT_JSON')
root = Path(sys.argv[1]).resolve()
import subprocess
revision = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
if revision != '4a8e1061254004d9dac807054eed33fad7d1ff14':
    raise SystemExit('Unexpected upstream revision: ' + revision)
for name, path in [('automationbench', root/'automationbench'), ('automationbench.domains', root/'automationbench/domains')]:
    package = types.ModuleType(name)
    package.__path__ = [str(path)]
    sys.modules[name] = package
class Dataset:
    @staticmethod
    def from_list(rows):
        return rows
module = types.ModuleType('datasets')
module.Dataset = Dataset
sys.modules['datasets'] = module
all_rows=[]
for domain in ['sales','marketing','operations','support','finance','hr','simple']:
    package = types.ModuleType('automationbench.domains.'+domain)
    package.__path__=[str(root/'automationbench/domains'/domain)]
    sys.modules[package.__name__]=package
    tasks=importlib.import_module(package.__name__+'.tasks')
    rows=getattr(tasks,'get_'+domain+'_dataset')()
    for row in rows:
        info=json.loads(row['info']) if isinstance(row['info'],str) else row['info']
        row['info']=info
        all_rows.append({'domain':domain,**row})
    print(domain,len(rows))
Path(sys.argv[2]).write_text(json.dumps(all_rows,ensure_ascii=False,indent=2)+'\n')
print('total',len(all_rows),'unique ids',len({r['example_id'] for r in all_rows}))
print('first info keys', list(all_rows[0]['info']))
