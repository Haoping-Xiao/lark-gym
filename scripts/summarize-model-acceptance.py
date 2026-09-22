"""Summarize trusted Harbor artifacts; keep excluded/errored samples out of success rates."""
import argparse, collections, json
from pathlib import Path
from urllib.parse import urlsplit

def read(path):
    return json.loads(path.read_text()) if path.is_file() else None

def summarize(job, expected):
    entries, seen, endpoints = [], set(), collections.Counter()
    for trial in sorted(job.glob('*/result.json')):
        result = read(trial)
        name = result['task_name'].split('/')[-1]
        if name not in expected or name in seen:
            raise ValueError(f'Unexpected or duplicate trial: {name}')
        seen.add(name)
        root = trial.parent
        state = read(root / 'artifacts/var/lib/feishu-mock/state.json')
        verdict = read(root / 'verifier/result.json') or {}
        calls = (state or {}).get('calls', [])
        gaps = [c for c in calls if c.get('status') == 501]
        for c in calls:
            endpoints[(c['method'], urlsplit(c['path']).path, c['status'])] += 1
        exception = result.get('exception_info')
        rewards = (result.get('verifier_result') or {}).get('rewards')
        coverage = verdict.get('coverage') or {}
        if not state:
            status = 'missing_state'
        elif any(c.get('status', 0) >= 500 and c.get('status') != 501 for c in calls):
            status = 'environment_error'
        elif gaps and coverage.get('valid_sample') is not True:
            status = 'environment_excluded'
        elif exception:
            status = 'execution_error'
        elif not rewards:
            status = 'missing_reward'
        elif verdict.get('semantic_status') in ['pending', 'not_run_excluded']:
            status = 'unjudged'
        else:
            status = 'valid_pass' if all(v == 1 for v in rewards.values()) else 'valid_fail'
        entries.append(dict(task=name, status=status, rewards=rewards,
                            semantic_status=verdict.get('semantic_status'),
                            environment_gap_count=len(gaps),
                            exception=exception, trial=str(root),
                            trajectories=[str(p) for p in root.glob('agent/**/trajectory*.json')],
                            unsupported=[{'seq':c.get('seq'),'method':c.get('method'),
                                          'path':c.get('path')} for c in gaps]))
    missing = sorted(set(expected) - seen)
    counts = dict(collections.Counter(e['status'] for e in entries))
    valid = counts.get('valid_pass',0) + counts.get('valid_fail',0)
    return dict(expected_tasks=len(expected), observed_tasks=len(seen), missing_tasks=missing,
                counts=counts, valid_success_rate=counts.get('valid_pass',0)/valid if valid else None,
                endpoint_observations=[dict(method=k[0],path=k[1],status=k[2],count=v)
                                       for k,v in sorted(endpoints.items())],
                coverage_note='Observed endpoints only; not a coverage percentage over the CLI API surface.',
                trials=entries)

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('job',type=Path);p.add_argument('selection',type=Path)
    p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    result=summarize(a.job,read(a.selection));a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k not in ['trials','endpoint_observations']}))
    # Agent mistakes and discovered gaps are observations; missing trials are not completion.
    if result['missing_tasks']: raise SystemExit(1)
