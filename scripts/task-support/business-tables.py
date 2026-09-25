"""Expose separate Base tables for distinct business entities, preserving source records."""
import ast, hashlib, json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
LABELS={'tickets':'客服工单','cases':'客户服务工单','contacts':'联系人','leads':'销售线索','opportunities':'商机','deals':'成交记录','accounts':'客户公司','companies':'客户公司','tasks':'工作事项','notes':'业务备注','events':'会议历史','campaigns':'营销活动','issues':'研发问题','cards':'看板卡片','posts':'内容排期','lookup_users':'成员资料','lookup_groups':'客服组资料'}
for task in sorted((ROOT/'tasks').glob('automationbench-*')):
    seed_path=task/'environment/seed.json';seed=json.loads(seed_path.read_text())
    base=seed['base'];expected=json.loads((task/'tests/expected.json').read_text())
    if base.get('tables'): continue
    records=base['records'];by_id={r['record_id']:r['fields']['collection'] for r in records}
    collections=sorted(set(by_id.values())|{r['collection'] for r in expected['creates']})
    if not collections: continue
    tables=[];global_fields={f['name']:f for f in base.get('fields',[])}
    for collection in collections:
        samples=[r['fields'] for r in records if r['fields']['collection']==collection]+[r for r in expected['creates'] if r['collection']==collection]
        names={k for row in samples for k in row if k!='collection'}
        names.update(u['field'] for u in expected['updates'] if by_id.get(u['record_id'])==collection)
        fields=[global_fields.get(name, {'name':name,'type':'number' if any(isinstance(row.get(name),(int,float)) for row in samples) else 'text'}) for name in sorted(names)]
        tables.append({'table_id':'tbl_'+hashlib.sha256(collection.encode()).hexdigest()[:12], 'name':LABELS.get(collection,collection), 'collection':collection, 'read_only':collection.startswith('lookup_'), 'fields':fields})
    base['tables']=tables;seed_path.write_text(json.dumps(seed,ensure_ascii=False,indent=2)+'\n')
    table_ids={table['collection']:table['table_id'] for table in tables}
    p=task/'solution/solve.ts';source=p.read_text();a=source.index('=',source.index('const commands'))+1;b=source.index('\n];',a)+2
    commands=ast.literal_eval(source[a:b].strip());updated=[]
    for args in commands:
        if args[0]!='base' or '--table-id' not in args: updated.append(args);continue
        at=args.index('--table-id')+1
        if args[1]=='+record-list':
            for table in tables:
                new=args.copy();new[at]=table['table_id'];updated.append(new)
        elif args[1] in ['+record-upsert','+record-delete']:
            data=json.loads(args[args.index('--json')+1]) if '--json' in args else None
            record_id=args[args.index('--record-id')+1] if '--record-id' in args else None
            collection=by_id.get(record_id) if record_id else (data or {}).get('collection')
            if collection is None: raise ValueError((task.name,args))
            new=args.copy();new[at]=table_ids[collection]
            if data is not None:
                data.pop('collection',None);new[args.index('--json')+1]=json.dumps(data,ensure_ascii=False)
            updated.append(new)
        else: raise ValueError((task.name,args))
    p.write_text("import { execFileSync } from 'node:child_process';\nconst commands: string[][] = "+json.dumps(updated,ensure_ascii=False,indent=2)+";\nfor (const args of commands) execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });\n")
    instruction=task/'instruction.md';text=instruction.read_text()
    text=re.sub(r'[，。]collection 为 [^。]+。','。',text)
    text=text.replace('原业务表映射为同名 collection。','')
    text=text.replace('collection 为 quickbooks_、xero_ 或 wave_ 加原集合名。','不同财务实体分别存放在对应的业务表中。')
    instruction.write_text(text)
