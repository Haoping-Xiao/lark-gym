"""Reviewed native business adaptation; run through apply.py after base task generation."""
from pathlib import Path
import json,re,shutil,subprocess,sys
repo=Path(sys.argv[1]).resolve();g=Path(sys.argv[2]).resolve();names=[p.parent.parent.name for p in (repo/'tasks').glob('automationbench-*/tests/expected.json') if any(c.get('collection') in ['notion_pages','confluence_pages'] for c in json.loads(p.read_text()).get('creates',[]))]
for n in names:
 if repo!=g:shutil.copytree(repo/'tasks'/n,g/'tasks'/n,dirs_exist_ok=True)
# Keep per-task verifier specializations and current native-mail rules.
for n in names:
 t=g/'tasks'/n;s=json.loads((t/'environment/seed.json').read_text());e=json.loads((t/'tests/expected.json').read_text());cfg=json.loads((t/'tests/semantic-config.json').read_text());sol=(t/'solution/solve.ts').read_text();commands=json.loads(subprocess.check_output(['node','-e',"const fs=require('fs'),vm=require('vm');const s=fs.readFileSync(process.argv[1],'utf8');console.log(JSON.stringify(vm.runInNewContext(s.match(/const commands: string\\[\\]\\[\\] = ([\\s\\S]*?);\\nfor/)[1])))",str(t/'solution/solve.ts')]))
 docindices={i for i,c in enumerate(e['creates'])if c['collection'] in ['notion_pages','confluence_pages']};docrows=[e['creates'][i]for i in sorted(docindices)];assert len(docrows)==1,n
 d=docrows[0];i=min(docindices);contentkey='content'if 'content'in d else 'body';parent=d.get('parent_page',d.get('database_id',d.get('space_id',d.get('space','')))); folders=[]
 if parent:folders=[{'token':parent,'name':'Ops Reports'if parent=='db_ops_reports'else parent}]
 s['docs']={'folders':folders,'documents':[]};removed={'notion_pages','confluence_pages','notion_find_page'};tableids={x['table_id']for x in s['base']['tables']if x['collection']in removed}
 s['base']['tables']=[x for x in s['base']['tables']if x['collection']not in removed];s['base']['records']=[r for r in s['base']['records']if r['fields'].get('collection')not in removed]
 if s['base']['table_id']in tableids:
  s['base']['table_id']=s['base']['tables'][0]['table_id'] if s['base']['tables']else 'tbl_unused'
  s['base']['fields']=s['base']['tables'][0]['fields'] if s['base']['tables']else []
 terms=cfg.get('literal_creation_terms',{}).get(str(i),{}).get(contentkey)
 semantic=contentkey in cfg.get('text_fields',[]) and contentkey not in cfg.get('literal_fields',[])
 rule={'parent_token':parent,'title':d['title'],'content':d[contentkey],'semantic_content':semantic,'source_collection':d['collection']}
 if e.get('creation_contains',{}).get(str(i),{}).get('title'):rule['title_contains']=e['creation_contains'][str(i)]['title']
 if terms:rule['content_literal']=terms
 elif not semantic and e.get('creation_contains',{}).get(str(i),{}).get(contentkey):rule['content_literal']=e['creation_contains'][str(i)][contentkey]
 if n.endswith('-1270'):rule['link_chats']=[m['chat_id']for m in e['messages']if any('lark-gym://'in x for x in m.get('contains',[]))]
 e['documents']=[rule]
 remap={str(j):str(k)for k,j in enumerate(j for j in range(len(e['creates']))if j not in docindices)}
 e['creates']=[c for j,c in enumerate(e['creates'])if j not in docindices]
 for key in ['creation_contains']:
  if key in e:e[key]={remap[j]:v for j,v in e[key].items()if j in remap}
 for key in ['literal_creation_terms','creation_text_fields','creation_one_of','creation_field_variants']:
  if key in cfg:cfg[key]={remap[j]:v for j,v in cfg[key].items()if j in remap}
 for group in e.get('order_groups',[]):
  if group.get('collection')in removed:group['kind']='document';group.pop('collection')
 output=[]
 for c in commands:
  table=c[c.index('--table-id')+1]if '--table-id'in c else None
  if c[:2]==['base','+record-list']and table in tableids:
   output.append(['drive','files','list','--params','{}']);continue
  if c[:2]==['base','+record-upsert']and table in tableids:
   vals=json.loads(c[c.index('--json')+1]);command=['docs','+create','--doc-format','markdown','--title',vals['title'],'--content',vals.get('content',vals.get('body',''))]
   if parent:command+=['--parent-token',parent]
   output.append(command);continue
  if d.get('uri'):c=[x.replace(d['uri'],'document-url:0') for x in c]
  output.append(c)
 # Resolve URL from actual create response for board notices; no invented URI.
 solve="import { execFileSync } from 'node:child_process';\nconst commands: string[][] = "+json.dumps(output,ensure_ascii=False,indent=2)+";\nconst documentURLs: string[] = [];\nfor (const command of commands) {\n const args = command.map(s => s.replace(/document-url:(\\d+)/g, (_, i) => { if (!documentURLs[Number(i)]) throw new Error('Document not created'); return documentURLs[Number(i)]; }));\n const output = execFileSync(process.env.LARK_CLI || 'lark-cli', [...args, '--format', 'json'], {encoding:'utf8'});\n process.stdout.write(output);\n if (args[0] === 'docs' && args[1] === '+create') documentURLs.push(JSON.parse(output).data.document.url);\n}\n"
 (t/'solution/solve.ts').write_text(solve)
 # Native docs satisfy their own checks and protected-state accounting.
 v=(t/'tests/verify.ts').read_text();v="import { verifyDocuments } from './documents.ts';\n"+v
 v=v.replace('const expected: {','const expected: {\n documents?: any[];',1)
 anchor='const protectedWorld = structuredClone(world);';assert anchor in v,n
 v=v.replace(anchor,"const documentResult = verifyDocuments(seed, world, expected.documents || [], calls);\n"+anchor+"\nif (protectedWorld.docs) protectedWorld.docs = documentResult.protectedDocs;",1)
 v=v.replace('const success =','const success =\n  documentResult.passed &&',1)
 v=v.replace('      creationChecks,','      documentChecks: documentResult.checks,\n      creationChecks,',1);(t/'tests/verify.ts').write_text(v)
 shutil.copy(g/'scripts/task-support/documents.ts',t/'tests/documents.ts')
 sem=(t/'tests/semantic.ts').read_text();anchor='  const deferred: string[] = [];';assert anchor in sem
 sem=sem.replace(anchor,anchor+"\n  for (const [i, doc] of (expected.documents || []).entries()) if (doc.semantic_content) deferred.push(`documents[${i}].content`);",1);(t/'tests/semantic.ts').write_text(sem)
 # Avoid teaching legacy record creation; use explicit Lark parent mappings.
 instruction=(t/'instruction.md').read_text()
 instruction=instruction.replace('notion_pages','飞书文档').replace('confluence_pages','飞书文档').replace('Notion记录','飞书文档').replace('Notion改','文档使用').replace('Confluence改','文档使用').replace('原Drive/Notion移至Base业务台账','原Drive暂按Base文件台账管理；文档改用飞书文档')
 # Remove service metadata, retain all business requirements; parent now native folder.
 instruction=re.sub(r'cloudId=cloud_ops/','',instruction).replace('type=page/','').replace('space_id=','父目录=').replace('parent_page=','父目录=').replace('space=HR','父目录=HR').replace('database_id由Ops Reports查询','父目录从云盘中查找Ops Reports')
 if d.get('uri'):instruction=instruction.replace('uri='+d['uri']+'/','').replace('议程uri','实际新文档链接').replace('；uri 是台账内的业务引用，不作为网页链接','')
 instruction+='\n文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。'+('本题将原目录映射为飞书云盘目录 '+parent+'。'if parent else '本题文档创建在当前用户云盘根目录。')+' 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。\n'
 for p in [t/'instruction.md',t/'tests/task-instruction.md']:p.write_text(instruction)
 for path,obj in [(t/'environment/seed.json',s),(t/'tests/expected.json',e),(t/'tests/semantic-config.json',cfg)]:path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
print('prepared',len(names))
