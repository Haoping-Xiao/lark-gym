import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
test('DeepSeek transport uses JSON mode without changing other judges or swallowing errors', () => {
  const output = execFileSync(
    'python3',
    [
      '-c',
      `
import asyncio,runpy,sys,types,json
seen=[]; validated=[]
validator=types.ModuleType('jsonschema')
def validate(instance,schema):
 validated.append((instance,schema))
 if instance=={}: raise ValueError('missing fields')
validator.validate=validate;sys.modules['jsonschema']=validator
async def original(**kw):
 seen.append(kw)
 if kw.get('fail'): raise RuntimeError('provider failed')
 return types.SimpleNamespace(choices=[types.SimpleNamespace(message=types.SimpleNamespace(content=json.dumps({} if kw.get('malformed') else {'score':1,'reasoning':'ok'})))])
lite=types.ModuleType('litellm');lite.acompletion=original;sys.modules['litellm']=lite
main=types.ModuleType('rewardkit.__main__');main.main=lambda:None;sys.modules['rewardkit.__main__']=main
runpy.run_path('gyms/lark-cli/docker/rewardkit-deepseek.py',run_name='compat_test')
schema={'type':'json_schema','json_schema':{'name':'test','schema':{'type':'object'}}}
async def run():
 await lite.acompletion(model='deepseek/deepseek-v4-pro',response_format=schema)
 assert validated==[({'score':1,'reasoning':'ok'},{'type':'object'})]
 assert seen[-1]['response_format']=={'type':'json_object'} and seen[-1]['max_tokens']==4096
 assert schema['type']=='json_schema'
 await lite.acompletion(model='openai/other',response_format=schema)
 assert seen[-1]['response_format']==schema and 'max_tokens' not in seen[-1]
 try: await lite.acompletion(model='deepseek/deepseek-v4-pro',fail=True)
 except RuntimeError: pass
 else: raise AssertionError('error swallowed')
 try: await lite.acompletion(model='deepseek/deepseek-v4-pro',response_format=schema,malformed=True)
 except ValueError: pass
 else: raise AssertionError('invalid response accepted')
asyncio.run(run());print('pass')
`,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(output.trim(), 'pass');
});
