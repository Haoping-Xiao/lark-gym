"""Create controlled post-state tests from oracle artifacts, not agent trajectories."""
import copy, json, sys
from pathlib import Path

def variants(task, source, expected):
    result = []
    def add(name, state, reward):
        state['fixture_type'] = 'controlled_post_state_not_agent_trajectory'
        # Do not present historical writes as evidence for the perturbed world.
        state['calls'] = [c for c in state.get('calls', []) if not c.get('changed')]
        result.append((name, state, reward))
    if task == 'automationbench-finance-4001':
        state = copy.deepcopy(source)
        cell = expected['cells'][0]
        rows = sorted({c['row'] for c in expected['cells']})
        assert len(rows) == 2
        book = state['world']['spreadsheets'][cell['spreadsheet_token']] if cell.get('spreadsheet_token') else state['world']
        values = book['sheets'][cell['sheet_id']]['values']
        values[rows[0]], values[rows[1]] = values[rows[1]], values[rows[0]]
        add('reordered-invoices', state, 1)
        bad = copy.deepcopy(state)
        book = bad['world']['spreadsheets'][cell['spreadsheet_token']] if cell.get('spreadsheet_token') else bad['world']
        book['sheets'][cell['sheet_id']]['values'][rows[0]][cell['column']] = 'Incorrect vendor'
        add('wrong-vendor', bad, 0)
    if task == 'automationbench-finance-4008':
        state = copy.deepcopy(source)
        original_ids = {m['message_id'] for m in state['seed']['messages']}
        sent = [m for m in state['world']['messages'] if m['message_id'] not in original_ids]
        assert len(sent) == 1
        message = sent[0]
        lines = json.loads(message['body']['content'])['text'].strip().splitlines()
        assert len(lines) == 4
        state['world']['messages'] = [m for m in state['world']['messages'] if m['message_id'] in original_ids]
        for i, line in enumerate(lines):
            part = copy.deepcopy(message);part['message_id'] = f'fixture-report-{i}'
            part['body']['content'] = json.dumps({'text':line},ensure_ascii=False)
            state['world']['messages'].append(part)
        add('split-complete-report', state, 1)
        missing = copy.deepcopy(state);missing['world']['messages'].pop()
        add('missing-report-item', missing, 0)
        duplicate = copy.deepcopy(state);part = copy.deepcopy(duplicate['world']['messages'][-1])
        part['message_id'] = 'fixture-duplicate';duplicate['world']['messages'].append(part)
        add('duplicate-report-item', duplicate, 0)
    return result

if __name__ == '__main__':
    job, out = map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True);manifest=[]
    for trial in sorted(job.glob('*/result.json')):
        task = json.loads(trial.read_text())['task_name'].split('/')[-1]
        if task not in ['automationbench-finance-4001','automationbench-finance-4008']:continue
        source = json.loads((trial.parent/'artifacts/var/lib/feishu-mock/state.json').read_text())
        expected = json.loads((Path('tasks')/task/'tests/expected.json').read_text())
        for name,state,reward in variants(task,source,expected):
            path=out/f'{task}-{name}.json';path.write_text(json.dumps(state,ensure_ascii=False)+'\n')
            manifest.append(dict(task=task,name=name,state=str(path),expected_reward=reward))
    assert len(manifest)==5, 'Both source oracle snapshots required'
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
