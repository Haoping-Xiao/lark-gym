"""Reviewed native business adaptation; run through apply.py after base task generation."""
from pathlib import Path
import json,re,shutil,subprocess,sys
repo=Path(sys.argv[1]).resolve();g=Path(sys.argv[2]).resolve();names=['automationbench-hr-5099','automationbench-marketing-1077','automationbench-sales-1006','automationbench-marketing-1151','automationbench-operations-1368','automationbench-sales-1134']
for n in names:
 t=g/'tasks'/n;
 if repo!=g:shutil.copytree(repo/'tasks'/n,t,dirs_exist_ok=True)
 s=json.loads((t/'environment/seed.json').read_text());e=json.loads((t/'tests/expected.json').read_text());cfg=json.loads((t/'tests/semantic-config.json').read_text());removed={'policy_pages','handoff_documents','canva_designs','reports','research_briefs'};tables={x['table_id']:x['collection']for x in s['base']['tables']if x['collection']in removed}
 if not tables:continue
 s['docs']={'folders':[{'token':'ops','name':'ops'}]if n.endswith('1077')else [],'documents':[]}
 s['base']['tables']=[x for x in s['base']['tables']if x['collection']not in removed];assert not any(x['fields']['collection']in removed for x in s['base']['records']),n
 if s['base']['table_id']in tables:s['base']['table_id']=s['base']['tables'][0]['table_id']if s['base']['tables']else 'tbl_unused';s['base']['fields']=s['base']['tables'][0]['fields']if s['base']['tables']else []
 def doc(c):
  if c.get('collection')=='policy_pages':return c['title'],'', '\n'.join(k+': '+c[k]for k in ['version','effective_date','status'])+'\n\n'+c['body'],[k+': '+c[k]for k in ['version','effective_date','status']],'body'
  if c.get('collection')=='handoff_documents':return c['campaign'],'ops','campaign: '+c['campaign']+'\nrecipient: '+c['recipient']+'\n\n'+c['content'],['campaign: '+c['campaign'],'recipient: '+c['recipient']],'content'
  if c.get('collection')=='reports':return c['title'],c.get('folder',c.get('workspace','')),c['body'],[],'body'
  if c.get('collection')=='research_briefs':return c['subject'],'',c['body'],[],'body'
  return c['title'],'','display_amount: '+c['display_amount']+'\n\nARR milestone design brief.',['display_amount: '+c['display_amount']],'content'
 originals=e['creates'];remap={str(i):str(j)for j,i in enumerate(i for i,c in enumerate(originals)if c['collection']not in removed)};e['documents']=[]
 for i,c in enumerate(originals):
  if c['collection']not in removed:continue
  title,parent,body,literals,key=doc(c);rule={'title':title,'parent_token':parent,'content':body,'content_literal':literals+cfg.get('literal_creation_terms',{}).get(str(i),{}).get(key,[]),'semantic_content':True,'source_collection':c['collection']}
  if e.get('creation_contains',{}).get(str(i),{}).get('title'):rule['title_contains']=e['creation_contains'][str(i)]['title']
  if c['collection']=='research_briefs':rule['semantic_title']=True
  if parent and not any(f['token']==parent for f in s['docs']['folders']):s['docs']['folders'].append({'token':parent,'name':parent})
  e['documents'].append(rule)
 e['creates']=[c for c in originals if c['collection']not in removed]
 if n.endswith('1006'):
  for c in e['creates']:
   if c['collection']=='linkedin_posts':assert c['status']=='Published';c['status']='Queued'
 for k in ['creation_contains']:e[k]={remap[i]:v for i,v in e.get(k,{}).items()if i in remap}
 for k in ['literal_creation_terms','creation_text_fields','creation_one_of','creation_field_variants']:
  if k in cfg:cfg[k]={remap[i]:v for i,v in cfg[k].items()if i in remap}
 source=(t/'solution/solve.ts').read_text();match=re.search(r'const commands: string\[\]\[\] = ([\s\S]*?);\nfor',source);commands=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('vm').runInNewContext(process.argv[1])))",match.group(1)]));output=[]
 for c in commands:
  table=c[c.index('--table-id')+1]if '--table-id'in c else None
  if c[:2]==['base','+record-list']and table in tables:output.append(['docs','+search','--query','']);continue
  if c[:2]==['base','+record-upsert']and table in tables:
   vals=json.loads(c[c.index('--json')+1]);vals['collection']=tables[table];title,parent,body,_,_=doc(vals);c=['docs','+create','--doc-format','markdown','--title',title,'--content',body]+(['--parent-token',parent]if parent else [])
  elif n.endswith('1006')and '--json'in c:
   j=c.index('--json')+1;vals=json.loads(c[j]);
   if vals.get('status')=='Published':vals['status']='Queued';c[j]=json.dumps(vals,ensure_ascii=False)
  output.append(c)
 source=source[:match.start(1)]+json.dumps(output,ensure_ascii=False,indent=2)+source[match.end(1):];(t/'solution/solve.ts').write_text(source)
 v=(t/'tests/verify.ts').read_text();v="import { verifyDocuments } from './documents.ts';\n"+v;v=v.replace('const expected: {','const expected: {\n documents?: any[];',1);a='const protectedWorld = structuredClone(world);';assert a in v;v=v.replace(a,"const documentResult = verifyDocuments(seed, world, expected.documents || [], calls);\n"+a+"\nif (protectedWorld.docs) protectedWorld.docs = documentResult.protectedDocs;",1);v=v.replace('const success =','const success =\n documentResult.passed &&',1).replace('      creationChecks,','      documentChecks: documentResult.checks,\n      creationChecks,',1);(t/'tests/verify.ts').write_text(v);shutil.copy(g/'scripts/task-support/documents.ts',t/'tests/documents.ts')
 sem=(t/'tests/semantic.ts').read_text().replace('  const deferred: string[] = [];','  const deferred: string[] = [];\n  for (const [i, doc] of (expected.documents || []).entries()) if (doc.semantic_content) deferred.push(`documents[${i}].content`);',1);(t/'tests/semantic.ts').write_text(sem)
 ins=(t/'instruction.md').read_text()
 if n.endswith('5099'):ins=ins.replace('Confluence页面改policy_pages飞书台账title、version、effective_date、status（Final为current，Under Review为draft）、body完整Content','每份政策创建一份真实飞书文档，title为政策名；正文先分别写 version: <版本>、effective_date: <日期>、status: <状态>（Final为current，Under Review为draft），再保留完整Content')
 elif n.endswith('1077'):ins=ins.replace('原文件归档改为 handoff_documents 台账，每份包含 folder=ops、campaign、recipient、content（完整交接正文）','每项活动创建真实飞书文档，标题为活动名，父目录为 ops；正文先写 campaign: <活动名> 和 recipient: <收件人>，再附完整交接正文')
 elif n.endswith('1151'):ins=ins.replace('把副本保存为 reports 台账（folder=analytics、title=ATTRIBUTION-JANUARY-2026、body=报告全文）','把报告全文保存为真实飞书文档，父目录 analytics，标题 ATTRIBUTION-JANUARY-2026')
 elif n.endswith('1368'):ins=ins.replace('将合并建议保存为飞书报告台账 reports 记录，title 为 Space Consolidation Report - Q1 2026，workspace 为 sp_facilities，body 列','将合并建议保存为真实飞书文档，标题为 Space Consolidation Report - Q1 2026，父目录为 sp_facilities，正文列')
 elif n.endswith('1134'):ins=ins.replace('保存research_briefs飞书台账（subject、body）','保存为真实飞书文档（标题说明研究对象，正文为完整研究简报）')
 else:ins=ins.replace('制作里程碑设计并发布LinkedIn/群公告','制作里程碑设计需求文档、提交社媒文案审核队列，并向飞书群公告').replace('Canva改为canva_designs飞书设计台账：title包含ARR与compact总数、display_amount用一位小数$X.XM；LinkedIn改为linkedin_posts发布台账text与status=Published，本次只登记发布记录，不向外部平台发布','创建真实飞书设计需求文档：标题包含ARR与compact总数，正文用 display_amount: $X.XM 表示一位小数展示金额；linkedin_posts 多维表格保存待审核文案 text 与 status=Queued，不表示已外部发布').replace('发布文本及群消息','待审核文案及群消息')
 ins+='\n飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。\n'
 for p in [t/'instruction.md',t/'tests/task-instruction.md']:p.write_text(ins)
 e.setdefault('source_assertion_overrides',{})['native_documents']='External page/design/archive operations are adapted to actual Lark Docs; metadata retained in declared body fields. Social status Queued means internal review only.'
 for p,x in [(t/'environment/seed.json',s),(t/'tests/expected.json',e),(t/'tests/semantic-config.json',cfg)]:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
print('prepared',len(names))
