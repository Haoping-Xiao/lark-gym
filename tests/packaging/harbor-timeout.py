"""Exercise timeout, backend artifacts and grading with scripted actions, no model calls."""
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[2]
runs = root / 'runs/harbor'
runs.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='timeout-fixture-', dir=runs) as temporary:
    task = Path(temporary) / 'maintenance-timeout'
    shutil.copytree(root / 'tasks/maintenance-notice', task)
    config = task / 'task.toml'
    text = config.read_text().replace('feishu/maintenance-notice', 'feishu/maintenance-timeout')
    text = re.sub(r'(\[agent\]\s*timeout_sec\s*=\s*)[0-9.]+', r'\g<1>10.0', text)
    config.write_text(text)
    # Complete the task after an unsupported request, then exceed the native timeout.
    (task / 'solution/solve.sh').write_text('''#!/bin/sh
set -eu
if lark-cli calendar events search_event --calendar-id cal_ops --data '{"query":"maintenance","unsupported_option":true}'; then
  echo 'Expected unsupported operation' >&2
  exit 1
fi
node /solution/entry.ts
sleep 300
''')
    job_name = Path(temporary).name + '-job'
    subprocess.run(['harbor', 'run', '--path', str(task), '--agent', 'oracle',
                    '--jobs-dir', str(runs), '--job-name', job_name], check=True, cwd=root)
    job = runs / job_name
    results = list(job.glob('*/result.json'))
    assert len(results) == 1, results
    result = json.loads(results[0].read_text())
    exception = result.get('exception_info') or {}
    assert exception.get('exception_type') == 'AgentTimeoutError', exception
    assert result['verifier_result']['rewards']['reward'] == 1, result['verifier_result']
    trial = results[0].parent
    state = json.loads((trial / 'artifacts/var/lib/feishu-mock/state.json').read_text())
    gaps = [call for call in state['calls'] if call['status'] == 501]
    assert len(gaps) == 1 and not gaps[0]['changed'], gaps
    assert any(call['changed'] and call['seq'] > gaps[0]['seq'] for call in state['calls'])
    assert 'ENV_UNSUPPORTED' in (trial / 'agent/oracle.txt').read_text()
    report = json.loads(subprocess.check_output(
        ['node', 'scripts/analysis/unsupported.ts', str(job)], cwd=root))
    assert report['affectedTrials'] == 1 and report['unsupportedRequests'] == 1, report
    print(f'Timeout preserved artifacts, marker and reward 1: {job}')
