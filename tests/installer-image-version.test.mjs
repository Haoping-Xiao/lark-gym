import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
test('environment reinstall selects complete image tags without prefix corruption', () => {
  const script = `import tempfile,pathlib,json,importlib.util,sys
r=pathlib.Path(sys.argv[1]);spec=importlib.util.spec_from_file_location('installer',r/'scripts/task-support/install.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
cases=[({},'0.2.6'),({'calendars':[{'type':'primary'}]},'0.2.8'),({'chats':[{'mention_support':True}]},'0.2.8'),({'mail':{}},'0.2.9'),({'mail':{},'chats':[{'post_support':True}]},'0.2.10'),({'mail':{'attachment_support':True},'chats':[{'post_support':True}]},'0.2.11')]
count=0
with tempfile.TemporaryDirectory() as td:
 t=pathlib.Path(td);(t/'environment').mkdir();(t/'tests').mkdir()
 for seed,want in cases:
  for old in ['0.2.0','0.2.6','0.2.9','0.2.10','0.2.11','0.2.100','0.2.1000']:
   (t/'environment/seed.json').write_text(json.dumps(seed));(t/'environment/mock.Dockerfile').write_text('FROM lark-gym-mock:'+old+'\\nCOPY seed.json /opt/mock/seed.json\\n');(t/'environment/Dockerfile').write_text('FROM lark-gym-cli:0.2.1\\n');(t/'environment/docker-compose.yaml').write_text('services:\\n  main:\\n    build: .\\n  mock:\\n    build: .\\n')
   m.install_environment(t);before={p.name:p.read_text() for p in (t/'environment').iterdir()}
   assert (t/'environment/mock.Dockerfile').read_text().splitlines()[0]=='FROM lark-gym-mock:'+want
   for attempt in range(3):
    m.install_environment(t);assert before=={p.name:p.read_text()for p in (t/'environment').iterdir()}
   count+=1
print(count)`;
  assert.equal(
    execFileSync('python', ['-c', script, process.cwd()], {
      encoding: 'utf8',
    }).trim(),
    '42',
  );
});
