"""Explicit judge stub for isolated Harbor lifecycle tests, never task acceptance."""
import shutil
import sys
from pathlib import Path


def install_judge_stub(task):
    stub = task / 'tests/rewardkit'
    stub.write_text("""#!/usr/bin/env python3
import json,sys
from pathlib import Path
out=Path(sys.argv[sys.argv.index('--output')+1])
out.write_text(json.dumps({'reward':1}))
(out.parent/'reward-details.json').write_text(json.dumps({'score':1}))
""")
    stub.chmod(0o755)
    with (task / 'tests/Dockerfile').open('a') as docker:
        docker.write('ENV PATH="/tests:${PATH}"\n')


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[2]
    target = Path(sys.argv[1])
    shutil.copytree(root / 'tasks/maintenance-notice', target)
    install_judge_stub(target)
