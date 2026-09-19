"""Build individually adapted formal tasks; unresolved tasks remain in the manifest."""
import json,sys,shutil,re
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[2]
rows=json.loads(Path(sys.argv[1]).read_text())
def scalar(v):
    if isinstance(v,(dict,list,bool)) or v is None:return json.dumps(v,ensure_ascii=False,separators=(',',':'))
    return v
def empty(value):
    return all(empty(v) for v in value.values()) if isinstance(value,dict) else len(value)==0 if isinstance(value,list) else value in (None,'')
def millis(value):
    if value is None:return '0'
    if isinstance(value,(int,float)):return str(int(value*1000 if abs(value)<1e12 else value))
    parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
    if parsed.tzinfo is None:parsed=parsed.replace(tzinfo=timezone.utc)
    return str(int(parsed.timestamp()*1000))
def calendar_time(value):
    return {'date':value} if re.fullmatch(r'\d{4}-\d{2}-\d{2}',value) else {'timestamp':str(int(int(millis(value))/1000))}
recipes=json.loads(Path(__file__).with_name('formal.zh.json').read_text())
for row in rows:
    key=f"{row['domain']}-{row['example_id']}"
    if key not in recipes:continue
    recipe=recipes[key];src=row['info']['initial_state'];now=recipe.get('now',src.get('meta',{}).get('current_time','2026-02-24T09:00:00Z'))
    for app,payload in src.items():
        assert app in ['meta','salesforce','google_sheets','gmail','slack','zendesk','helpscout','quickbooks','xero','wave','google_calendar','hubspot','mailchimp'] or empty(payload),(key,'unmapped source app',app)
    records=[]
    for user in src.get('slack',{}).get('users',[]):
        records.append({'record_id':'rec_user_'+user['id'],'fields':{'collection':'lookup_users',**{k:scalar(v) for k,v in user.items()}}})
    for collection,items in src.get('salesforce',{}).items():
        for item in items:
            records.append({'record_id':'rec_'+str(item['id']),'fields':{'collection':collection,**{k:scalar(v) for k,v in item.items() if k!='id'}}})
    for collection,items in src.get('zendesk',{}).items():
        assert isinstance(items,list),(key,'unsupported zendesk collection',collection)
        for item in items:
            records.append({'record_id':'rec_zendesk_'+str(item['id']),'fields':{'collection':'support_'+collection,**{k:scalar(v) for k,v in item.items() if k!='id'}}})
    for collection,items in src.get('helpscout',{}).items():
        assert isinstance(items,list),(key,'unsupported helpscout collection',collection)
        for item in items:
            records.append({'record_id':'rec_helpscout_'+str(item['id']),'fields':{'collection':'help_'+collection,**{k:scalar(v) for k,v in item.items() if k!='id'}}})
    for app in ['quickbooks','xero','wave']:
        for collection,items in src.get(app,{}).items():
            assert isinstance(items,list),(key,'unsupported finance collection',app,collection)
            for item in items:
                identity=next((item[k] for k in ['id','credit_note_id','invoice_id','contact_id'] if k in item),None)
                assert identity is not None,(key,app,collection,'missing identity')
                records.append({'record_id':'rec_'+app+'_'+str(identity),'fields':{'collection':app+'_'+collection,**{k:scalar(v) for k,v in item.items()}}})
    for collection,items in src.get('hubspot',{}).items():
        assert isinstance(items,list),(key,'unsupported hubspot collection',collection)
        for item in items:
            properties=item.get('properties',{})
            assert isinstance(properties,dict),(key,'hubspot properties not object')
            flat={k:scalar(v) for k,v in item.items() if k not in ['id','properties']}
            assert not (set(flat)&set(properties)),(key,'hubspot property collision')
            records.append({'record_id':'rec_hubspot_'+str(item['id']),'fields':{'collection':'hubspot_'+collection,**flat,**{k:scalar(v) for k,v in properties.items()}}})
    mailing=src.get('mailchimp',{})
    mailingLists={a['id'] for a in mailing.get('audiences',[])}
    subscribers=list(mailing.get('subscribers',[]))
    for audience in mailing.get('audiences',[]):
        records.append({'record_id':'rec_mailchimp_audiences_'+audience['id'],'fields':{'collection':'mailchimp_audiences',**{k:scalar(v) for k,v in audience.items() if k!='subscribers'}}})
        for subscriber in audience.get('subscribers',[]):
            assert subscriber.get('list_id',audience['id'])==audience['id'],(key,'mailchimp audience mismatch')
            subscribers.append({**subscriber,'list_id':audience['id']})
    subscriberIds=set()
    for subscriber in subscribers:
        assert subscriber['list_id'] in mailingLists,(key,'unknown mailing list')
        identity=str(subscriber.get('id',subscriber['list_id']+':'+subscriber['email']))
        assert identity not in subscriberIds,(key,'duplicate subscriber identity',identity)
        subscriberIds.add(identity)
        records.append({'record_id':'rec_mailchimp_subscribers_'+identity,'fields':{'collection':'mailchimp_subscribers',**{k:scalar(v) for k,v in subscriber.items()}}})
    for collection,items in mailing.items():
        if collection in ['audiences','subscribers']:continue
        assert isinstance(items,list),(key,'unsupported mailchimp collection',collection)
        for item in items:
            assert isinstance(item,dict) and 'id' in item,(key,'missing mailchimp identity',collection)
            records.append({'record_id':'rec_mailchimp_'+collection+'_'+str(item['id']),'fields':{'collection':'mailchimp_'+collection,**{k:scalar(v) for k,v in item.items()}}})
    spreadsheets={}
    for originalBook in src.get('google_sheets',{}).get('spreadsheets',[]):
        book={**originalBook,'id':originalBook.get('id',originalBook.get('spreadsheet_id'))}
        sheets={}
        sourceSheets=src.get('google_sheets',{})
        worksheets=book.get('worksheets',[])+[w for w in sourceSheets.get('worksheets',[]) if w.get('spreadsheet_id')==book['id']]
        for originalWorksheet in worksheets:
            w={**originalWorksheet,'id':originalWorksheet.get('id',originalWorksheet.get('worksheet_id'))}
            w['rows']=w.get('rows',[])+[r for r in sourceSheets.get('rows',[]) if r.get('spreadsheet_id')==book['id'] and r.get('worksheet_id')==w['id']]
            rs=[r.get('cells',{k:v for k,v in r.items() if k!='row_id'}) for r in w.get('rows',[])]
            extraHeaders=[k for operation in recipe.get('sheets',[]) if operation['book']==book['id'] and operation['sheet']==w['id'] for k in operation.get('append',operation.get('fields',{}))]
            headers=list(dict.fromkeys([*w.get('headers',[]),*(k for r in rs for k in r),*extraHeaders]))
            matrix=[headers]
            for i,(original,r) in enumerate(zip(w.get('rows',[]),rs)):
                sourceIndex=original.get('row_id',i+2)
                index=int(sourceIndex)-1 if str(sourceIndex).isdigit() else i+1
                assert index>0,(key,'invalid spreadsheet row index',sourceIndex)
                if not str(sourceIndex).isdigit():assert str(sourceIndex) in map(str,r.values()),(key,'unpreserved symbolic row ID',sourceIndex)
                while len(matrix)<=index:matrix.append(['']*len(headers))
                matrix[index]=[scalar(r.get(k,'')) for k in headers]
            sheets[w['id']]={'title':w['title'],'values':matrix}
        spreadsheets[book['id']]={'title':book['title'],'sheets':sheets}
    calendars=[{'calendar_id':c['id'],'summary':c.get('summary',c['id']),'role':'owner'} for c in src.get('google_calendar',{}).get('calendars',[])]
    events=[]
    for event in src.get('google_calendar',{}).get('events',[]):
        cid=event.get('calendarid',event.get('calendar_id','primary'))
        if not any(c['calendar_id']==cid for c in calendars):calendars.append({'calendar_id':cid,'summary':cid,'role':'owner'})
        attendees=[{'attendee_id':'at_'+str(i),'type':'third_party','third_party_email':a if isinstance(a,str) else a['email']} for i,a in enumerate(event.get('attendees',[]))]
        events.append({'event_id':event['id'],'calendar_id':cid,'summary':event.get('summary',''),'description':event.get('description','')+'\n原始元数据：'+json.dumps(event,ensure_ascii=False),'start_time':calendar_time(event['start__dateTime']),'end_time':calendar_time(event['end__dateTime']),'status':event.get('status','confirmed'),'attendees':attendees,**({'location':{'name':event['location']}} if event.get('location') else {})})
    chats=[{'chat_id':'oc_mail','name':'业务来信','chat_mode':'group'}];messages=[]
    for originalMessage in src.get('gmail',{}).get('messages',[]):
        m={**originalMessage,'from_':originalMessage.get('from_',originalMessage.get('from','未标注')),'body_plain':originalMessage.get('body_plain',originalMessage.get('body',''))}
        text=f"原始消息元数据：{json.dumps({k:v for k,v in m.items() if k!='body_plain'},ensure_ascii=False)}\n消息 ID：{m['id']}\n来源：{m['from_']}\n收件人：{', '.join(m.get('to',[]))}\n日期：{m.get('date','未标注')}\n主题：{m.get('subject','')}\n{m.get('body_plain','')}"
        messages.append({'message_id':'om_'+m['id'],'chat_id':'oc_mail','msg_type':'text','body':{'content':json.dumps({'text':text},ensure_ascii=False)},'create_time':millis(m.get('date'))})
    emails=sorted(set(re.findall(r'[A-Za-z0-9_.+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',json.dumps(src)+' '+json.dumps(row['prompt']))))
    destinations={address:'oc_email_'+str(i) for i,address in enumerate(emails)}
    chats.extend({'chat_id':cid,'name':address,'chat_mode':'p2p'} for address,cid in destinations.items())
    for c in src.get('slack',{}).get('channels',[]):chats.append({'chat_id':'oc_'+c['id'],'name':c['name'],'chat_mode':'group'})
    for i,m in enumerate(src.get('slack',{}).get('messages',[])):
        channel_id='oc_'+str(m.get('channel_id',m.get('channel','')))
        if not any(c['chat_id']==channel_id for c in chats):chats.append({'chat_id':channel_id,'name':channel_id,'chat_mode':'group'})
        messages.append({'message_id':'om_slack_'+str(i),'chat_id':'oc_'+str(m.get('channel_id',m.get('channel',''))),'msg_type':'text','body':{'content':json.dumps({'text':'原始消息元数据：'+json.dumps({k:v for k,v in m.items() if k!='text'},ensure_ascii=False)+'\n'+m.get('text','')},ensure_ascii=False)},'create_time':str(m.get('ts','0'))})
    updates=[];commands=[['im','+chat-messages-list','--chat-id','oc_mail'],['base','+record-list','--base-token','base_crm','--table-id','tbl_crm']]
    for u in recipe.get('updates',[]):
        record=next(r for r in records if r['record_id']=='rec_'+u['id'])
        for field,value in u['fields'].items():
            record['fields'].setdefault(field,'')
            updates.append({'record_id':record['record_id'],'field':field,'value':value,'mode':u.get('modes',{}).get(field,'equals')})
        commands.append(['base','+record-upsert','--base-token','base_crm','--table-id','tbl_crm','--record-id',record['record_id'],'--json',json.dumps({**u['fields'],**u.get('oracle_fields',{})},ensure_ascii=False)])
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
            column=headers.index(field);cellChecks.append({'spreadsheet_token':token,'sheet_id':sid,'row':index,'column':column,'value':value,**({'one_of':operation['one_of'][field]} if field in operation.get('one_of',{}) else {}),**({'contains':operation['contains'][field]} if field in operation.get('contains',{}) else {})})
            col='';n=column+1
            while n:n,rem=divmod(n-1,26);col=chr(65+rem)+col
            commands.append(['sheets','+cells-set','--spreadsheet-token',token,'--sheet-id',sid,'--range',col+str(index+1),'--cells',json.dumps([[{'value':value}]],ensure_ascii=False)])
    eventChecks=[]
    allocated={e['event_id'] for e in events};nextEvent=1
    for event in recipe.get('events',[]):
        cid=event['calendar_id']
        if not any(c['calendar_id']==cid for c in calendars):calendars.append({'calendar_id':cid,'summary':cid,'role':'owner'})
        data={k:v for k,v in event.items() if k not in ['calendar_id','start','end','attendees','description_contains']}
        data.update({'start_time':{'timestamp':str(int(int(millis(event['start']))/1000))},'end_time':{'timestamp':str(int(int(millis(event['end']))/1000))}})
        eventChecks.append({**data,'calendar_id':cid,'attendees':event.get('attendees',[]),**({'description_contains':event['description_contains']} if event.get('description_contains') else {})})
        commands.append(['calendar','events','create','--calendar-id',cid,'--data',json.dumps(data,ensure_ascii=False)])
        while 'evt_'+str(nextEvent) in allocated:nextEvent+=1
        eid='evt_'+str(nextEvent);allocated.add(eid);nextEvent+=1
        if event.get('attendees'):commands.append(['calendar','event.attendees','create','--calendar-id',cid,'--event-id',eid,'--data',json.dumps({'attendees':[{'type':'third_party','third_party_email':a} for a in event['attendees']]})])
    messageChecks=[]
    for m in recipe.get('messages',[]):
        cid=destinations[m['email']] if m.get('email') else next(c['chat_id'] for c in chats if c['name']==m['channel'])
        messageChecks.append({'chat_id':cid,'contains':m['contains']})
        commands.append(['im','+messages-send','--chat-id',cid,'--text',m['text']])
    forbidden=[]
    for a in row['info']['assertions']:
        if a['type']=='gmail_message_sent_to_with_body_not_contains':
            values=a.get('body_not_contains',a.get('body_contains'));assert values is not None,(key,'missing negative body constraint')
            values=[values] if isinstance(values,str) else values
            for value in values:forbidden.append({'chat_id':destinations[a['to']],'contains':[value]})
        elif a['type'] in ['gmail_message_not_sent_to','gmail_message_not_sent_to_with_body_contains','gmail_message_not_sent','gmail_email_not_sent_to','gmail_message_not_sent_with_body']:
            addresses=a.get('to',[]);addresses=[addresses] if isinstance(addresses,str) else addresses
            parts=[]
            for field in ['subject','subject_contains','body_contains']:
                value=a.get(field,[]);parts.extend([value] if isinstance(value,str) else value)
            for address in addresses:
                if address in destinations:forbidden.append({'chat_id':destinations[address],'contains':parts})
            if not addresses:
                for cid in destinations.values():forbidden.append({'chat_id':cid,'contains':parts})
        elif a['type'] in ['slack_message_not_exists','slack_message_not_in_channel']:
            cid=next(c['chat_id'] for c in chats if (c['name']==a.get('channel_name',a.get('channel')) or c['chat_id']=='oc_'+str(a.get('channel_id',''))));tokens=a.get('text_contains',[])
            forbidden.append({'chat_id':cid,'contains':[tokens] if isinstance(tokens,str) else tokens})
    forbiddenRecords=[]
    for a in row['info']['assertions']:
        if a['type']=='salesforce_note_not_exists':
            eq={'collection':'notes',**{k:a[k] for k in ['parent_id','title'] if k in a}}
            forbiddenRecords.append({'equals':eq,'contains':{'body':a['body_contains']} if 'body_contains' in a else {}})
    fields={k:'number' if isinstance(v,(int,float)) else 'text' for r in records for k,v in r['fields'].items()}
    for r in recipe.get('creates',[]):fields.update({k:'number' if isinstance(v,(int,float)) else 'text' for k,v in r.items()})
    seed={'now':now,'spreadsheet_token':'ss_unused','sheets':{},'spreadsheets':spreadsheets,'calendars':calendars,'events':events,'base':{'app_token':'base_crm','table_id':'tbl_crm','records':records,'fields':[{'name':k,'type':v} for k,v in fields.items()]},'chats':chats,'messages':messages}
    target=ROOT/'tasks'/('automationbench-'+key)
    shutil.copytree(ROOT/'tasks/automationbench-simple-3001',target,dirs_exist_ok=True)
    def write(path,value): (target/path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    write('environment/seed.json',seed)
    write('tests/expected.json',{'forbidden_records':forbiddenRecords,'forbidden_messages':forbidden,'updates':updates,'creates':recipe.get('creates',[]),'create_contains':recipe.get('create_contains',{}),'creation_contains':recipe.get('creation_contains',{}),'messages':messageChecks,'events':eventChecks,'cells':cellChecks})
    (target/'tests/verify.ts').write_text(Path(__file__).with_name('crm-verifier.ts').read_text())
    (target/'solution/solve.ts').write_text("import {execFileSync} from 'node:child_process';\nconst commands:string[][]="+json.dumps(commands,ensure_ascii=False)+";\nfor(const args of commands)execFileSync(process.env.LARK_CLI||'lark-cli',args,{stdio:'inherit'});\n")
    context='\n\n使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。\n'
    if 'mailchimp' in src:context+='\n邮件列表实体存放在 mailchimp_audiences / mailchimp_subscribers 等集合，以 list_id 关联，订阅状态直接写 status；归档写 archived，退订写 unsubscribed，保留记录用于审计。通过 Base 查询实际 record_id。\n'
    if 'hubspot' in src:context+='\nHubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。\n'
    if calendars:context+='\n日程使用飞书 calendar 命令，日历 ID：'+', '.join(c['calendar_id'] for c in calendars)+'。使用来源明确时区；未标时区按 UTC。\n'
    if spreadsheets:context+='\n飞书电子表格目录：\n'+'\n'.join(f"- {token}：{b['title']}；工作表 "+', '.join(f"{sid}（{w['title']}）" for sid,w in b['sheets'].items()) for token,b in spreadsheets.items())+'\n使用 sheets 业务命令读取表格。\n'
    (target/'instruction.md').write_text(recipe['instruction']+context+'\n当前时间固定为 '+now+'。\n')
    toml=(target/'task.toml').read_text().replace('automationbench-simple-3001','automationbench-'+key).replace('source_domain = "simple"',f'source_domain = "{row["domain"]}"').replace('source_id = 3001',f'source_id = {row["example_id"]}').replace('scored_domain = false','scored_domain = true').replace('"simple",',f'"{row["domain"]}",')
    toml=re.sub(r'source_task = ".*"',f'source_task = "{row["info"]["task_name"]}"',toml)
    (target/'task.toml').write_text(toml)
print('Generated',len(recipes),'formal task packages')
