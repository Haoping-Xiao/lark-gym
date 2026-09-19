"""Build individually adapted formal tasks; unresolved tasks remain in the manifest."""
import json,sys,shutil,re
from pathlib import Path
from datetime import datetime
ROOT=Path(__file__).resolve().parents[2]
rows=json.loads(Path(sys.argv[1]).read_text())
def scalar(v):
    if isinstance(v,(dict,list,bool)) or v is None:return json.dumps(v,ensure_ascii=False,separators=(',',':'))
    return v
recipes=json.loads(Path(__file__).with_name('formal.zh.json').read_text())
for row in rows:
    key=f"{row['domain']}-{row['example_id']}"
    if key not in recipes:continue
    recipe=recipes[key];src=row['info']['initial_state'];now=src.get('meta',{}).get('current_time','2026-02-24T09:00:00Z')
    records=[]
    for collection,items in src.get('salesforce',{}).items():
        for item in items:
            records.append({'record_id':'rec_'+str(item['id']),'fields':{'collection':collection,**{k:scalar(v) for k,v in item.items() if k!='id'}}})
    spreadsheets={}
    for book in src.get('google_sheets',{}).get('spreadsheets',[]):
        sheets={}
        for w in book['worksheets']:
            rs=[r.get('cells',{k:v for k,v in r.items() if k!='row_id'}) for r in w.get('rows',[])]
            extraHeaders=[k for operation in recipe.get('sheets',[]) if operation['book']==book['id'] and operation['sheet']==w['id'] for k in operation.get('append',operation.get('fields',{}))]
            headers=list(dict.fromkeys([*w.get('headers',[]),*(k for r in rs for k in r),*extraHeaders]))
            matrix=[headers]
            for i,(original,r) in enumerate(zip(w.get('rows',[]),rs)):
                index=int(original.get('row_id',i+2))-1
                while len(matrix)<=index:matrix.append(['']*len(headers))
                matrix[index]=[scalar(r.get(k,'')) for k in headers]
            sheets[w['id']]={'title':w['title'],'values':matrix}
        spreadsheets[book['id']]={'title':book['title'],'sheets':sheets}
    chats=[{'chat_id':'oc_mail','name':'业务来信','chat_mode':'group'}];messages=[]
    for m in src.get('gmail',{}).get('messages',[]):
        text=f"原始消息元数据：{json.dumps({k:v for k,v in m.items() if k!='body_plain'},ensure_ascii=False)}\n消息 ID：{m['id']}\n来源：{m['from_']}\n收件人：{', '.join(m.get('to',[]))}\n日期：{m.get('date','未标注')}\n主题：{m.get('subject','')}\n{m.get('body_plain','')}"
        messages.append({'message_id':'om_'+m['id'],'chat_id':'oc_mail','msg_type':'text','body':{'content':json.dumps({'text':text},ensure_ascii=False)},'create_time':str(int(datetime.fromisoformat(m['date'].replace('Z','+00:00')).timestamp()*1000)) if m.get('date') else '0'})
    emails=sorted(set(re.findall(r'[A-Za-z0-9_.+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',json.dumps(src)+' '+json.dumps(row['prompt']))))
    destinations={address:'oc_email_'+str(i) for i,address in enumerate(emails)}
    chats.extend({'chat_id':cid,'name':address,'chat_mode':'p2p'} for address,cid in destinations.items())
    for c in src.get('slack',{}).get('channels',[]):chats.append({'chat_id':'oc_'+c['id'],'name':c['name'],'chat_mode':'group'})
    for i,m in enumerate(src.get('slack',{}).get('messages',[])):
        messages.append({'message_id':'om_slack_'+str(i),'chat_id':'oc_'+str(m.get('channel_id',m.get('channel',''))),'msg_type':'text','body':{'content':json.dumps({'text':'原始消息元数据：'+json.dumps({k:v for k,v in m.items() if k!='text'},ensure_ascii=False)+'\n'+m.get('text','')},ensure_ascii=False)},'create_time':str(m.get('ts','0'))})
    updates=[];commands=[['im','+chat-messages-list','--chat-id','oc_mail'],['base','+record-list','--base-token','base_crm','--table-id','tbl_crm']]
    for u in recipe.get('updates',[]):
        record=next(r for r in records if r['record_id']=='rec_'+u['id'])
        for field,value in u['fields'].items():
            record['fields'].setdefault(field,'')
            updates.append({'record_id':record['record_id'],'field':field,'value':value,'mode':u.get('modes',{}).get(field,'equals')})
        commands.append(['base','+record-upsert','--base-token','base_crm','--table-id','tbl_crm','--record-id',record['record_id'],'--json',json.dumps(u['fields'],ensure_ascii=False)])
    for fields in recipe.get('creates',[]):commands.append(['base','+record-upsert','--base-token','base_crm','--table-id','tbl_crm','--json',json.dumps(fields,ensure_ascii=False)])
    cellChecks=[]
    appendRows={}
    for operation in recipe.get('sheets',[]):
        token=operation['book'];sid=operation['sheet'];matrix=spreadsheets[token]['sheets'][sid]['values'];headers=matrix[0]
        if 'append' in operation:
            index=len(matrix)+appendRows.get((token,sid),0);appendRows[token,sid]=appendRows.get((token,sid),0)+1;changes=operation['append']
        else:
            matches=[i for i,row in enumerate(matrix[1:],1) if all(row[headers.index(k)]==v for k,v in operation['match'].items())]
            assert len(matches)==1,(key,operation,matches)
            index=matches[0];changes=operation['fields']
        for field,value in changes.items():
            column=headers.index(field);cellChecks.append({'spreadsheet_token':token,'sheet_id':sid,'row':index,'column':column,'value':value,**({'contains':operation['contains'][field]} if field in operation.get('contains',{}) else {})})
            col='';n=column+1
            while n:n,rem=divmod(n-1,26);col=chr(65+rem)+col
            commands.append(['sheets','+cells-set','--spreadsheet-token',token,'--sheet-id',sid,'--range',col+str(index+1),'--cells',json.dumps([[{'value':value}]],ensure_ascii=False)])
    messageChecks=[]
    for m in recipe.get('messages',[]):
        cid=destinations[m['email']] if m.get('email') else next(c['chat_id'] for c in chats if c['name']==m['channel'])
        messageChecks.append({'chat_id':cid,'contains':m['contains']})
        commands.append(['im','+messages-send','--chat-id',cid,'--text',m['text']])
    forbidden=[]
    for a in row['info']['assertions']:
        if a['type']=='gmail_message_sent_to_with_body_not_contains':
            values=a['body_not_contains'];values=[values] if isinstance(values,str) else values
            for value in values:forbidden.append({'chat_id':destinations[a['to']],'contains':[value]})
        elif a['type'] in ['slack_message_not_exists','slack_message_not_in_channel']:
            cid=next(c['chat_id'] for c in chats if c['name']==a['channel_name']);tokens=a.get('text_contains',[])
            forbidden.append({'chat_id':cid,'contains':[tokens] if isinstance(tokens,str) else tokens})
    forbiddenRecords=[]
    for a in row['info']['assertions']:
        if a['type']=='salesforce_note_not_exists':
            eq={'collection':'notes',**{k:a[k] for k in ['parent_id','title'] if k in a}}
            forbiddenRecords.append({'equals':eq,'contains':{'body':a['body_contains']} if 'body_contains' in a else {}})
    fields={k:'number' if isinstance(v,(int,float)) else 'text' for r in records for k,v in r['fields'].items()}
    for r in recipe.get('creates',[]):fields.update({k:'number' if isinstance(v,(int,float)) else 'text' for k,v in r.items()})
    seed={'now':now,'spreadsheet_token':'ss_unused','sheets':{},'spreadsheets':spreadsheets,'calendars':[],'events':[],'base':{'app_token':'base_crm','table_id':'tbl_crm','records':records,'fields':[{'name':k,'type':v} for k,v in fields.items()]},'chats':chats,'messages':messages}
    target=ROOT/'tasks'/('automationbench-'+key)
    shutil.copytree(ROOT/'tasks/automationbench-simple-3001',target,dirs_exist_ok=True)
    def write(path,value): (target/path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    write('environment/seed.json',seed)
    write('tests/expected.json',{'forbidden_records':forbiddenRecords,'forbidden_messages':forbidden,'updates':updates,'creates':recipe.get('creates',[]),'create_contains':recipe.get('create_contains',{}),'messages':messageChecks,'events':[],'cells':cellChecks})
    (target/'tests/verify.ts').write_text(Path(__file__).with_name('crm-verifier.ts').read_text())
    (target/'solution/solve.ts').write_text("import {execFileSync} from 'node:child_process';\nconst commands:string[][]="+json.dumps(commands,ensure_ascii=False)+";\nfor(const args of commands)execFileSync(process.env.LARK_CLI||'lark-cli',args,{stdio:'inherit'});\n")
    context='\n\n使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。\n'
    if spreadsheets:context+='\n飞书电子表格目录：\n'+'\n'.join(f"- {token}：{b['title']}；工作表 "+', '.join(f"{sid}（{w['title']}）" for sid,w in b['sheets'].items()) for token,b in spreadsheets.items())+'\n使用 sheets 业务命令读取表格。\n'
    (target/'instruction.md').write_text(recipe['instruction']+context+'\n当前时间固定为 '+now+'。\n')
    toml=(target/'task.toml').read_text().replace('automationbench-simple-3001','automationbench-'+key).replace('source_domain = "simple"',f'source_domain = "{row["domain"]}"').replace('source_id = 3001',f'source_id = {row["example_id"]}').replace('scored_domain = false','scored_domain = true').replace('"simple",',f'"{row["domain"]}",')
    toml=re.sub(r'source_task = ".*"',f'source_task = "{row["info"]["task_name"]}"',toml)
    (target/'task.toml').write_text(toml)
print('Generated',len(recipes),'formal task packages')
