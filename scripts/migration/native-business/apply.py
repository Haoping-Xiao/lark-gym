"""Apply reviewed native business transformations after ordinary task regeneration.

Usage: python scripts/migration/native-business/apply.py [source-checkout] [target-checkout]
"""
import sys, subprocess
from pathlib import Path
here=Path(__file__).resolve().parent
source=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else here.parents[2]
target=Path(sys.argv[2]).resolve() if len(sys.argv)>2 else source
for script in ['documents.py','drive.py','extra-documents.py','extra-drive.py','social-queue.py']:
 subprocess.run([sys.executable,str(here/script),str(source),str(target)],check=True)

# Newly native seeds require the corresponding independently deployed Mock image.
import json, re
for path in (target/'tasks').glob('automationbench-*/environment/seed.json'):
 seed=json.loads(path.read_text())
 if 'docs' in seed or 'drive_files' in seed:
  docker=path.with_name('mock.Dockerfile')
  docker.write_text(re.sub(r'lark-gym-mock:0\.2\.\d+', 'lark-gym-mock:0.2.16', docker.read_text()))
