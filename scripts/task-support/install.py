"""Copy shared support into task packages; never rewrite business verification rules."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHARED = ('semantic.ts', 'semantic.toml', 'evaluate.ts', 'semantic-evidence.ts')
def install_environment(task):
    """Select the shared backend image; task packages own their service layout."""
    docker = task / 'environment/mock.Dockerfile'
    docker.write_text(re.sub(r'(?m)^FROM lark-gym-mock:[0-9.]+$',
                            'FROM lark-gym-mock:0.2.18', docker.read_text()))


def install(task):
    task_config = task / 'task.toml'
    config = task_config.read_text().replace('version = "0.1.0"', 'version = "0.2.0"')
    config = re.sub(r'(\[verifier\]\s*timeout_sec\s*=\s*)([0-9.]+)', lambda match: match[1] + str(max(300.0, float(match[2]))), config)
    task_config.write_text(config)
    install_environment(task)
    for name in SHARED:
        (task / 'tests' / name).write_text(Path(__file__).with_name(name).read_text())
    (task / 'tests/task-instruction.md').write_text((task / 'instruction.md').read_text())
    semantic_config = task / 'tests/semantic-config.json'
    if not semantic_config.exists():
        semantic_config.write_text(json.dumps({'enabled': True, 'text_fields': ['subject', 'description', 'body', 'text', 'notes', 'note', 'summary', 'reason', 'comment', 'content', 'body_text', 'message', 'caption', 'requirements'], **json.loads(Path(__file__).with_name('semantic-overrides.json').read_text()).get(task.name, {})}, indent=2) + '\n')
    (task / 'tests/test.sh').write_text('#!/bin/sh\nset -eu\nnode /tests/evaluate.ts\n')
    (task / 'tests/Dockerfile').write_text('FROM lark-gym-verifier:0.3.0\nCOPY . /tests\nWORKDIR /tests\n')

def check(task):
    return [str(task / 'tests' / name) for name in SHARED
            if (task / 'tests' / name).read_bytes() != Path(__file__).with_name(name).read_bytes()]

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Report shared-source drift without writing files')
    args = parser.parse_args()
    tasks = sorted((ROOT / 'tasks').glob('automationbench-*'))
    if args.check:
        drift = [path for task in tasks for path in check(task)]
        if drift:
            raise SystemExit('Shared verifier copies differ; run python3 scripts/task-support/install.py:\n' + '\n'.join(drift))
    else:
        for task in tasks:
            install(task)
