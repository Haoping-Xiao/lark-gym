"""Freeze a smoke/full selection and emit native Harbor configs, without credentials."""
import argparse, json, subprocess
from pathlib import Path

SMOKE = ['automationbench-simple-3151', 'automationbench-finance-4001',
         'automationbench-finance-4008', 'maintenance-notice']

def prepare(scope, shard, count, output):
    names = SMOKE if scope == 'smoke' else sorted(p.name for p in Path('tasks').glob('automationbench-*') if p.is_dir())
    if scope == 'full':
        assert len(names) == 800, 'Full acceptance requires exactly 800 tasks'
    assert 0 <= shard < count
    names = names[shard::count]
    assert names and all((Path('tasks') / n / 'task.toml').is_file() for n in names)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'selected-tasks.json').write_text(json.dumps(names) + '\n')
    for agent in ['oracle', 'nop', 'codex']:
        spec = {'name': agent}
        if agent == 'codex': spec['model_name'] = 'openai/gpt-6-astra'
        config = dict(job_name=f'acceptance-{agent}', jobs_dir=str(output),
                      n_concurrent_trials=1, agents=[spec], environment={'type': 'docker'},
                      datasets=[{'path': 'tasks', 'task_names': names}])
        (output / f'{agent}.yaml').write_text(json.dumps(config, indent=2) + '\n')
    return names

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--scope', choices=['smoke', 'full'], default='smoke')
    parser.add_argument('--shard', type=int, default=0)
    parser.add_argument('--shards', type=int, default=1)
    parser.add_argument('--output', type=Path, default=Path('runs/model-acceptance'))
    args = parser.parse_args()
    names = prepare(args.scope, args.shard, args.shards, args.output)
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    (args.output / 'run-manifest.json').write_text(json.dumps(dict(
        commit=commit, scope=args.scope, shard=args.shard, shards=args.shards,
        player_model='openai/gpt-6-astra', judge_model='openai/gpt-6-astra',
        harbor_commit='2993946dd5b64a46dac3aa766d03065f432a1468', tasks=names,
    ), indent=2) + '\n')
    print(json.dumps(names))
