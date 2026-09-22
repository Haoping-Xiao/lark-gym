"""Run the existing verifier image against controlled fixtures with live judges."""
import json, os, subprocess, sys
from pathlib import Path
root=Path(sys.argv[1]).resolve();manifest=json.loads((root/'manifest.json').read_text());results=[]
assert os.environ.get('OPENAI_API_KEY'), 'Configure model credentials before running'
for item in manifest:
    output=root/(item['task']+'-'+item['name']);output.mkdir(exist_ok=True)
    tests=(Path('tasks')/item['task']/'tests').resolve();state=Path(item['state']).resolve()
    container='judge-'+item['task']+'-'+item['name']
    cmd=['docker','run','--rm','--name',container,'--env','OPENAI_API_KEY','--env','MOCK_STATE=/state.json',
         '--env','VERIFIER_OUTPUT=/output','--mount',f'type=bind,source={tests},target=/tests,readonly',
         '--mount',f'type=bind,source={state},target=/state.json,readonly',
         '--mount',f'type=bind,source={output},target=/output',
         'lark-gym-verifier:0.3.0','node','/tests/evaluate.ts']
    with (output/'execution.log').open('w') as log:
        try: code=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,timeout=360).returncode
        except subprocess.TimeoutExpired:
            code=124
            subprocess.run(['docker','rm','-f',container],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=30)
    reward_path=output/'reward.txt';score=float(reward_path.read_text()) if reward_path.exists() else None
    results.append({**item,'exit_code':code,'actual_reward':score,
                    'passed':code==0 and score==item['expected_reward']})
(root/'results.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps([{'name':r['name'],'passed':r['passed']} for r in results]))
if not all(r['passed'] for r in results):raise SystemExit(1)
