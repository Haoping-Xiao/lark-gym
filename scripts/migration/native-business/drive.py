"""Reviewed native business adaptation; run through apply.py after base task generation."""
from pathlib import Path
import json,re,shutil,subprocess,sys
repo=Path(sys.argv[1]).resolve();g=Path(sys.argv[2]).resolve();names=['automationbench-operations-1221','automationbench-operations-1205','automationbench-hr-5057']
for n in names:
 t=g/'tasks'/n
 if repo!=g and n.endswith('5057'):shutil.copytree(repo/'tasks'/n,t,dirs_exist_ok=True)
 s=json.loads((t/'environment/seed.json').read_text());e=json.loads((t/'tests/expected.json').read_text());cfg=json.loads((t/'tests/semantic-config.json').read_text());s.setdefault('docs',{'folders':[],'documents':[]});s['drive_files']=[];rows={x['record_id']:x['fields']for x in s['base']['records']};removed={'google_drive_find_multiple_files','google_drive_folder','google_drive_folders','document_folders'};tableids={x['table_id']for x in s['base']['tables']if x['collection']in removed}
 if not tableids:continue
 def folder(token,name=None):
  if token and not any(f['token']==token for f in s['docs']['folders']):s['docs']['folders'].append({'token':token,'name':name or token,'parent_token':''})
 for f in rows.values():
  if f['collection']=='google_drive_find_multiple_files':s['drive_files'].append({'token':f['file'],'name':f['title'],'parent_token':f['folder'],'type':'file'});folder(f['folder'])
  if f['collection']in ['google_drive_folder','google_drive_folders']:folder(f.get('folder',f.get('id')),f['name'])
 e['file_moves']=[]
 for u in e['updates']:
  f=rows.get(u['record_id'],{})
  if f.get('collection')=='google_drive_find_multiple_files':assert u['field']=='folder';e['file_moves'].append({'token':f['file'],'parent_token':u['value']});folder(u['value'])
 e['updates']=[u for u in e['updates']if rows.get(u['record_id'],{}).get('collection')not in removed]
 creates=e['creates'];remap={str(i):str(j)for j,i in enumerate(i for i,c in enumerate(creates)if c['collection']not in removed)};e['folder_creates']=[{'name':c['name'],'parent_token':c['parent_id']}for c in creates if c['collection']=='document_folders'];e['creates']=[c for c in creates if c['collection']not in removed]
 for k in ['creation_contains']:e[k]={remap[i]:v for i,v in e.get(k,{}).items()if i in remap}
 for k in ['literal_creation_terms','creation_text_fields','creation_one_of','creation_field_variants']:
  if k in cfg:cfg[k]={remap[i]:v for i,v in cfg[k].items()if i in remap}
 s['base']['records']=[x for x in s['base']['records']if x['fields']['collection']not in removed];s['base']['tables']=[x for x in s['base']['tables']if x['collection']not in removed]
 if s['base']['table_id']in tableids:s['base']['table_id']=s['base']['tables'][0]['table_id']if s['base']['tables']else 'tbl_unused';s['base']['fields']=s['base']['tables'][0]['fields']if s['base']['tables']else []
 source=(t/'solution/solve.ts').read_text();match=re.search(r'const commands: string\[\]\[\] = ([\s\S]*?);\n(?:const documentURLs|for)',source);assert match,n
 commands=json.loads(subprocess.check_output(['node','-e',"const vm=require('vm');console.log(JSON.stringify(vm.runInNewContext(process.argv[1])))",match.group(1)]));output=[]
 for c in commands:
  table=c[c.index('--table-id')+1]if '--table-id'in c else None
  if c[:2]==['base','+record-list']and table in tableids:
   output.append(['drive','files','list','--params','{}'])
   for f in s['docs']['folders']:output.append(['drive','files','list','--params',json.dumps({'folder_token':f['token']})])
  elif c[:2]==['base','+record-upsert']and table in tableids:
   f=json.loads(c[c.index('--json')+1])
   if '--record-id'in c:
    row=rows[c[c.index('--record-id')+1]];output.append(['drive','+move','--file-token',row['file'],'--type','file','--folder-token',f['folder']])
   else:output.append(['drive','files','create_folder','--data',json.dumps({'name':f['name'],'folder_token':f['parent_id']})])
  else:output.append(c)
 source=source[:match.start(1)]+json.dumps(output,ensure_ascii=False,indent=2)+source[match.end(1):];(t/'solution/solve.ts').write_text(source)
 v=(t/'tests/verify.ts').read_text();v="import { verifyDrive } from './files.ts';\n"+v;v=v.replace('const expected: {','const expected: {\n file_moves?: any[]; folder_creates?: any[];',1)
 anchor='const protectedWorld = structuredClone(world);';v=v.replace(anchor,"const driveResult = verifyDrive(seed, world, expected);\n"+anchor+"\nprotectedWorld.drive_files = driveResult.protectedFiles;\nif (protectedWorld.docs) protectedWorld.docs.folders = driveResult.protectedDocs.folders;",1)
 v=v.replace('const success =','const success =\n driveResult.passed &&',1).replace('      creationChecks,','      fileMoveChecks: driveResult.moves,\n      folderChecks: driveResult.folders,\n      creationChecks,',1);(t/'tests/verify.ts').write_text(v);shutil.copy(g/'scripts/task-support/files.ts',t/'tests/files.ts')
 instruction=(t/'instruction.md').read_text()
 if n.endswith('1221'):instruction=instruction.replace('Drive文件台账google_drive_find_multiple_files改folder=fld_legal','通过飞书云盘将获准文件移动至 fld_legal 目录')
 elif n.endswith('1205'):instruction=instruction.replace('从google_drive_find_multiple_files和google_drive_folder台账','从飞书云盘的文件与目录').replace('将文件实体folder实际更新为目标ID','用 drive +move 将文件移至目标目录').replace('原Drive暂按Base文件台账管理；文档改用飞书文档','文件和文档均使用飞书云盘原生对象')
 else:instruction=instruction.replace('BambooHR profile、Drive文件夹、Jira工单分别改为employee_profiles、document_folders、onboarding_tickets飞书台账；保留上级Employee Documents来源标识，不是真实Drive权限目录。','员工档案和入职工单分别使用 employee_profiles、onboarding_tickets 飞书多维表格；在飞书云盘 Employee Documents 上级目录内真实创建员工文件夹。').replace('folder字段name=员工全名、parent_id','文件夹名称为员工全名，父目录为 Employee Documents 的实际 token')
 for p in [t/'instruction.md',t/'tests/task-instruction.md']:p.write_text(instruction)
 for p,x in [(t/'environment/seed.json',s),(t/'tests/expected.json',e),(t/'tests/semantic-config.json',cfg)]:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
print('prepared',len(names))
