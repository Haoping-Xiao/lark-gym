"""Reviewed native business adaptation; run through apply.py after base task generation."""
from pathlib import Path
import json,shutil,re,subprocess,sys
repo=Path(sys.argv[1]).resolve();g=Path(sys.argv[2]).resolve();n='automationbench-marketing-1003';t=g/'tasks'/n;
if repo!=g:shutil.copytree(repo/'tasks'/n,t,dirs_exist_ok=True)
s=json.loads((t/'environment/seed.json').read_text());e=json.loads((t/'tests/expected.json').read_text())
if not e['updates'] and all(c.get('status')=='Queued' for c in e['creates']):sys.exit(0)
updates={x['record_id']for x in e['updates']};assert all(x['field']=='like_count'for x in e['updates']);e['updates']=[]
for c in e['creates']:c['status']='Queued'
for table in s['base']['tables']:
 if table['collection']in ['twitter_likes','twitter_tweets']:
  if not any(f['name']=='status'for f in table['fields']):table['fields'].append({'name':'status','type':'text'})
  if table['table_id']==s['base']['table_id']:s['base']['fields']=table['fields']
src=(t/'solution/solve.ts').read_text();m=re.search(r'const commands: string\[\]\[\] = ([\s\S]*?);\nfor',src);commands=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('vm').runInNewContext(process.argv[1])))",m.group(1)]));out=[]
for c in commands:
 if '--record-id'in c and c[c.index('--record-id')+1]in updates:continue
 if c[:2]==['base','+record-upsert']and '--record-id'not in c:
  i=c.index('--json')+1;v=json.loads(c[i]);v['status']='Queued';c[i]=json.dumps(v,ensure_ascii=False)
 out.append(c)
(t/'solution/solve.ts').write_text(src[:m.start(1)]+json.dumps(out,ensure_ascii=False,indent=2)+src[m.end(1):])
ins=(t/'instruction.md').read_text().replace('点赞用 twitter_likes（user_id、tweet_id）记录并递增对应帖子 like_count；回复用 twitter_tweets 新记录（author_id、in_reply_to_tweet_id、text）','点赞建议写入 twitter_likes（user_id、tweet_id、status=Queued）；拟回复文案写入 twitter_tweets 新记录（author_id、in_reply_to_tweet_id、text、status=Queued），保留原帖子 like_count 不变').replace('本次只管理社媒业务台账','本次在飞书多维表格提交待审核互动建议，不实际点赞或向外部平台发帖；汇报时明确仍在队列')
for p in [t/'instruction.md',t/'tests/task-instruction.md']:p.write_text(ins)
e['source_assertion_overrides']['native_social_queue']='Adapt external like/reply actions to internal Lark Base Queued proposals; preserve source like_count; source publication assertions do not mean actual external execution.'
for p,x in [(t/'environment/seed.json',s),(t/'tests/expected.json',e)]:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
print(n)
