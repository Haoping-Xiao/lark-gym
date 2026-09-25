"""Migrate the reviewed simple CRM family from an exported upstream task list.
Usage: python scripts/migration/simple-crm.py /path/to/source-tasks.json
The input must come from upstream 4a8e1061254004d9dac807054eed33fad7d1ff14.
"""
import json, sys, base64
from datetime import datetime
from pathlib import Path
root=Path(__file__).resolve().parents[2]
translations=json.loads((Path(__file__).with_name('simple-crm.zh.json')).read_text())
extra=json.loads(Path(__file__).with_name('simple-crm-extra.json').read_text())
messageTasks=json.loads(Path(__file__).with_name('simple-messages.zh.json').read_text())
extra.update(messageTasks)
sheetTasks=json.loads(Path(__file__).with_name('simple-sheets.zh.json').read_text())
extra.update(sheetTasks)
calendarTasks=json.loads(Path(__file__).with_name('simple-calendar.zh.json').read_text())
extra.update(calendarTasks)
extra.update(json.loads(Path(__file__).with_name('simple-projects.zh.json').read_text()))
planningTasks=json.loads(Path(__file__).with_name('simple-planning.zh.json').read_text())
for key, plan in planningTasks.items():
    extra[key]={**plan,'creates':[{'collection':'posts','channel_id':channel,'scheduled_at':plan['scheduled_at'],'text':plan['text']} for channel in plan['channels']],'create_contains':{'text':plan['contains']}}
extra.update(json.loads(Path(__file__).with_name('simple-subscriptions.zh.json').read_text()))
mixedTasks=json.loads(Path(__file__).with_name('simple-mixed.zh.json').read_text())
extra.update(mixedTasks)
for key, value in mixedTasks.items():
    if 'calendar' in value:calendarTasks[key]=value['calendar']
    if 'sheet' in value:sheetTasks[key]=value['sheet']
translations.update({key:value['instruction'] for key,value in extra.items()})
rows=json.loads(Path(sys.argv[1]).read_text())
commit='4a8e1061254004d9dac807054eed33fad7d1ff14'
for row in rows:
    number=str(row['example_id'])
    if row['domain']!='simple' or number not in translations: continue
    info=row['info']; source=info['initial_state']; assertions=info['assertions']
    slug=f'automationbench-simple-{number}'
    target=root/'tasks'/slug
    for sub in ['environment','solution','tests']: (target/sub).mkdir(parents=True,exist_ok=True)
    records=[]
    for collection,items in source.get('salesforce',source.get('hubspot',{})).items():
        for item in items:
            fields={k:v for k,v in item.items() if k not in ('id','properties')}
            fields.update(item.get('properties',{}))
            fields['collection']=collection
            assert all(isinstance(v,(str,int,float)) for v in fields.values()), (number,fields)
            records.append({'record_id':'rec_'+item['id'],'fields':fields})
    records.extend(extra.get(number,{}).get('seed_records',[]))
    for collection in ['tickets','groups','users']:
        for item in source.get('zendesk',{}).get(collection,[]):
            records.append({'record_id':'rec_'+item['id'],'fields':{'collection':collection if collection=='tickets' else 'lookup_'+collection, **{key:value for key,value in item.items() if key!='id' and isinstance(value,(str,int,float))}}})
    for channel in source.get('buffer',{}).get('channels',[]):
        records.append({'record_id':'rec_'+channel['id'],'fields':{'collection':'channels',**{key:str(value).lower() if isinstance(value,bool) else value for key,value in channel.items()}}})
    for audience in source.get('mailchimp',{}).get('audiences',[]):
        records.append({'record_id':'rec_'+audience['id'],'fields':{'collection':'audiences','list_id':audience['id'],'name':audience['name']}})
    records.extend(extra.get(number,{}).get('supplemental_records',[]))
    for record in records:
        record['fields'].update(extra.get(number,{}).get('seed_record_fields',{}).get(record['record_id'],{}))
    messageTask=None if extra.get(number,{}).get('native_mail_only') else messageTasks.get(number)
    sheetTask=sheetTasks.get(number)
    calendarTask=calendarTasks.get(number)
    checks=[]
    updates={}
    create=extra.get(number,{}).get('create')
    creates=extra.get(number,{}).get('creates',[create] if create else [])
    if number in extra and not extra[number].get('preserve_source_assertions'):
        update=extra[number].get('update')
        assertions=[{'type':'salesforce_field_equals','record_id':update['id'],'field':key,'value':value} for key,value in update['fields'].items()] if update else []
    for a in assertions:
        assert a['type'] in ['salesforce_field_equals','salesforce_contact_field_equals','salesforce_lead_field_equals','salesforce_lead_field_contains'], a
        rid='rec_'+(a.get('record_id') or a.get('contact_id') or a['lead_id'])
        record=next(r for r in records if r['record_id']==rid)
        record['fields'].setdefault(a['field'],'')
        checks.append({'record_id':rid,'field':a['field'],'value':a['value'],'mode':'contains' if a['type'].endswith('contains') else 'equals'})
        if number == '3006' and a['field'] == 'description': checks[-1]['required_url']='https://'+a['value']
        updates.setdefault(rid,{})[a['field']]=('https://'+a['value']) if number == '3006' else a['value']
    # Preserve evidence text and literal values. Email delivery becomes an IM
    # notification channel; this is a workflow adaptation, not official scoring.
    messages=[]
    for item in ([] if extra.get(number,{}).get('native_mail') else source.get('gmail',{}).get('messages',[])):
        content=f"来源联系人：{item['from_']}\n主题：{item['subject']}\n日期：{item.get('date','')}\n{item['body_plain']}"
        messages.append({'message_id':'om_'+item['id'],'chat_id':'oc_updates','msg_type':'text','body':{'content':json.dumps({'text':content},ensure_ascii=False)},'create_time':str(int(datetime.fromisoformat(item['date'].replace('Z','+00:00')).timestamp()*1000))})
    seed={'now':extra.get(number,{}).get('now','2026-02-24T09:00:00Z'),'spreadsheet_token':'ss_unused','sheets':{},'calendars':[],'events':[], 'base':{'app_token':'base_crm','table_id':'tbl_crm','records':records},'chats':[{'chat_id':'oc_updates','name':'客户资料更新通知'}] if messages else [],'messages':messages}
    if extra.get(number,{}).get('native_mail'):
        mailbox=extra[number].get('native_mailbox','agent@company.example.com')
        boxes=[{'email_address':'agent@company.example.com','email_type':'USER_PRIMARY'}]
        if mailbox != 'agent@company.example.com':
            boxes[0]['email_type']='USER_PRIMARY'
            boxes.append({'email_address':mailbox,'email_type':'PUBLIC_MAILBOX'})
        encode=lambda text:base64.urlsafe_b64encode(text.encode()).decode().rstrip('=')
        incoming=[]
        for item in source.get('gmail',{}).get('messages',[]):
            assert mailbox in item['to'], ('review mailbox owner', number, mailbox)
            incoming.append({'message_id':item['id'],'mailbox_id':mailbox,'thread_id':item.get('thread_id','thread_'+item['id']),'smtp_message_id':item['id']+'@fixture.invalid','subject':item['subject'],'head_from':{'mail_address':item['from_']},'to':[{'mail_address':v} for v in item['to']],'cc':[],'bcc':[],'body_plain_text':encode(item['body_plain']),'body_preview':encode(item['body_plain'][:100]),'body_html':'','internal_date':str(int(datetime.fromisoformat(extra[number].get('native_mail_dates',{}).get(item['id'],item['date']).replace('Z','+00:00')).timestamp()*1000)),'message_state':1,'label_ids':(['UNREAD'] if 'UNREAD' in item['label_ids'] else []) if 'label_ids' in item else ([] if item.get('is_read') else ['UNREAD']),'folder_id':'INBOX','attachments':[]})
        seed['mail']={'mailboxes':boxes,'messages':incoming,'drafts':[]}
        if extra[number].get('native_mail_attachments'):seed['mail']['attachment_support']=True
    eventChecks=[]
    eventCommands=[]
    if calendarTask:
        seed['calendars']=[{'calendar_id':'cal_primary','summary':'工作日历','role':'owner'}]
        def time_value(value):
            result={'date':value} if len(value)==10 else {'timestamp':str(int(datetime.fromisoformat(value.replace('Z','+00:00')).timestamp()))}
            if calendarTask.get('timezone'):result['timezone']=calendarTask['timezone']
            return result
        event={'summary':calendarTask['summary'],'start_time':time_value(calendarTask['start']),'end_time':time_value(calendarTask['end'])}
        if calendarTask.get('recurrence'):event['recurrence']=calendarTask['recurrence']
        if calendarTask.get('location'):event['location']={'name':calendarTask['location']}
        if calendarTask.get('vc'):
            event['vc_data']={'vc_type':'vc','meeting_settings':{}}
            if calendarTask.get('password_required'):event['vc_data']['meeting_settings']['password']='428615'
            if calendarTask.get('join_meeting_permission'):event['vc_data']['meeting_settings']['join_meeting_permission']=calendarTask['join_meeting_permission']
        expected_event={**event,'calendar_id':'cal_primary','attendees':calendarTask['attendees']}
        if calendarTask.get('summary_contains'):expected_event['summary_contains']=calendarTask['summary_contains']
        expected_event.pop('vc_data',None)
        for flag in ['vc','password_required','join_meeting_permission']:
            if calendarTask.get(flag):expected_event[flag]=calendarTask[flag]
        eventChecks=[expected_event]
        eventCommands.append(['calendar','events','create','--calendar-id','cal_primary','--data',json.dumps(event,ensure_ascii=False)])
        if calendarTask['attendees']:
            eventCommands.append(['calendar','event.attendees','create','--calendar-id','cal_primary','--event-id','evt_1','--data',json.dumps({'attendees':[{'type':'third_party','third_party_email':email} for email in calendarTask['attendees']]})])
    sheetChecks=[]
    sheetCommands=[]
    if sheetTask:
        books=source['google_sheets']['spreadsheets']
        assert len(books)==1 and len(books[0]['worksheets'])==1
        book=books[0]; worksheet=book['worksheets'][0]
        worksheet.setdefault('rows',[])
        headers=list(dict.fromkeys([*worksheet.get('headers',[]),*(key for item in worksheet['rows'] for key in item if key!='row_id')]))
        for key in sheetTask.get('append',{}):
            if key not in headers: headers.append(key)
        values=[headers]+[[item.get(key,'') for key in headers] for item in worksheet['rows']]
        sid=worksheet['id']; token=book['id']
        seed['spreadsheet_token']=token
        seed['spreadsheet_title']=book['title']
        seed['sheets']={sid:{'title':worksheet['title'],'values':values}}
        changes=[]
        if sheetTask.get('append'):
            changes.append((len(values),{key:value for key,value in sheetTask['append'].items()}))
        for update in sheetTask.get('updates',[]):
            matches=[index+1 for index,item in enumerate(worksheet['rows']) if all(item.get(k)==v for k,v in update['match'].items())]
            assert len(matches)==1, (number,matches)
            changes.append((matches[0], update['fields']))
        for rowIndex, changeset in changes:
            for key,value in changeset.items():
                column=headers.index(key)
                sheetChecks.append({'sheet_id':sid,'row':rowIndex,'column':column,'value':value})
                cell=chr(65+column)+str(rowIndex+1)
                sheetCommands.append(['sheets','+cells-set','--spreadsheet-token',token,'--sheet-id',sid,'--range',cell,'--cells',json.dumps([[{'value':value}]],ensure_ascii=False)])
    for cell in sheetChecks:
        if extra.get(number,{}).get('cells_source_mail_id'):cell['source_mail_id']=extra[number]['cells_source_mail_id']
        if cell['column'] in extra.get(number,{}).get('date_columns',[]):cell['date_equivalent']=True
    messageChecks=[]
    if messageTask:
        for channel in source.get('slack',{}).get('channels',[]):
            seed['chats'].append({'chat_id':'oc_'+channel['id'],'name':channel['name'],'chat_mode':'group'})
        for user in source.get('slack',{}).get('users',[]):
            seed['chats'].append({'chat_id':'oc_'+user['id'],'name':user['name']+' '+user.get('email',''),'chat_mode':'p2p'})
        assertion=info['assertions'][0]
        if assertion['type']=='gmail_message_sent':
            destination='oc_recipient'
            if sheetTask:
                for index,item in enumerate(worksheet['rows']):
                    address=item.get('Email')
                    if address: seed['chats'].append({'chat_id':f'oc_contact_{index}','name':item.get('Name','')+' '+address,'chat_mode':'p2p'})
                destination=next(c['chat_id'] for c in seed['chats'] if assertion['to'][0] in c['name'])
            else: seed['chats'].append({'chat_id':destination,'name':assertion['to'][0],'chat_mode':'p2p'})
        elif assertion['type']=='slack_direct_message_sent': destination='oc_'+assertion['recipient_id']
        elif assertion['type']=='slack_message_in_channel': destination=next(c['chat_id'] for c in seed['chats'] if c['name']==assertion['channel_name'])
        else: raise ValueError(assertion)
        messageChecks=[{'chat_id':destination,'contains':messageTask['contains']}]
        if extra.get(number,{}).get('message_source_mail_id'):messageChecks[0]['source_mail_id']=extra[number]['message_source_mail_id']
    notificationCommands=[]
    for index, notice in enumerate(extra.get(number,{}).get('notifications',[])):
        for channel in source.get('slack',{}).get('channels',[]):
            if not any(c['chat_id']=='oc_'+channel['id'] for c in seed['chats']):seed['chats'].append({'chat_id':'oc_'+channel['id'],'name':channel['name'],'chat_mode':'group'})
        if extra.get(number,{}).get('native_mail') and notice.get('email'):
            if notice.get('reply_to'):
                notificationCommands.append(['mail','+reply','--mailbox',extra[number]['native_mailbox'],'--message-id',notice['reply_to'],'--body',notice['body'],'--confirm-send','--as','user'])
            else:
                notificationCommands.append(['mail','+send','--to',notice['email'],'--subject',notice['subject'],'--body',notice['body'],'--confirm-send','--as','user']+[value for filename in notice.get('attachments',[]) for value in ['--attach',filename]])
            continue
        if notice.get('channel'):
            destination=next(c['chat_id'] for c in seed['chats'] if c['name']==notice['channel'])
        else:
            destination=f'oc_notice_{index}'
            seed['chats'].append({'chat_id':destination,'name':notice['email'],'chat_mode':'p2p'})
        messageChecks.append({'chat_id':destination,'contains':notice['contains']})
        notificationCommands.append(['im','+messages-send','--chat-id',destination,'--text',notice['text']])
    for calendar in seed['calendars']:
        if extra.get(number,{}).get('primary_calendar') and calendar['calendar_id']=='cal_primary':calendar['type']='primary'
    for chat in seed['chats']:
        if chat['chat_id'] in extra.get(number,{}).get('mention_members',{}):chat.update(member_ids=extra[number]['mention_members'][chat['chat_id']],mention_support=True)
    for chat in seed['chats']:
        if chat['chat_id'] in extra.get(number,{}).get('post_channels',[]):chat['post_support']=True
    fieldTypes={key:'number' if isinstance(value,(int,float)) else 'text' for record in records for key,value in record['fields'].items()}
    for fields in creates: fieldTypes.update({key:'number' if isinstance(value,(int,float)) else 'text' for key,value in fields.items()})
    seed['base']['fields']=[{'name':key,'type':value} for key,value in fieldTypes.items()]
    (target/'environment/seed.json').write_text(json.dumps(seed,ensure_ascii=False,indent=2)+'\n')
    context='\n\n客户资料更新通知位于飞书群 oc_updates，请从消息中读取信息。' if messages else ''
    instruction=translations[number]+context+'\n\n业务台账位于飞书多维表格 base_crm / tbl_crm。记录 ID 为 rec_ 加原业务 ID；collection 字段区分 contacts（联系人）、leads（线索）、opportunities（商机）、campaigns（活动）、cases（工单）、tasks（跟进事项）、notes（备注）、events（会议历史）、deals（商机）、accounts/companies（客户公司）、issues（研发工单）、cards（看板卡片）；lookup_ 开头的记录是只读查找资料。字段名及需要精确写入的数据保留原文。只新增或更新任务要求的数据，不修改其他数据，也不发送额外消息。\n\n使用本环境提供的 Mock 版 lark-cli，通过 base、im 等正常业务命令完成任务。可用 --help 查询命令。不要直接访问 HTTP、后端文件、参考解或评分器。所有业务数据必须通过 CLI 读取。\n'
    if messageTask:
        instruction=translations[number]+'\n\n使用 Mock 版 lark-cli 的 im 业务命令完成任务。通过 im +chat-list --types=p2p,group 查找群和私聊会话，名称包含联系人姓名或电子邮件地址；传入对应 chat_id 发送消息。需要查找的来信已同步到 oc_updates 通知群。只向任务要求的会话发送一条消息，不更改原消息或其他业务数据。邮件标题放在消息首行，正文使用中文，保留专有名称、金额、日期及链接。不得直接访问 HTTP 或后端文件。\n'
    if sheetTask:
        instruction=translations[number]+'\n\n使用 Mock 版 lark-cli 的 sheets 业务命令读写电子表格，使用 im 业务命令读取消息。需要查找的来信已同步到 oc_updates 通知群，消息中保留来源联系人、标题、日期和正文。第一行为字段名；先读取表格，再在末尾追加或更新指定单元格，不改变其他内容。可用 --help 查询命令；不得直接访问 HTTP、后端文件、参考解或评分器。\n'
    if calendarTask:
        instruction=translations[number]+'\n\n使用 Mock 版 lark-cli 的 calendar 业务命令完成任务。参会人通过邮箱邀请；未指定时长的会议默认 60 分钟。全天日程的结束日期为不包含的下一天。需要查找的来信已同步到 oc_updates 通知群，可通过 im 业务命令读取。不要创建重复日程，不修改其他业务数据；不得直接访问 HTTP、后端文件、参考解或评分器。\n'
    if number in planningTasks:
        instruction+='\n内容排期保存在 posts 记录中，字段为 channel_id、scheduled_at（ISO 8601）、text（文案）。channels 记录提供渠道清单。排期未注明时区时使用 UTC；上午或未指定时刻为 09:00，中午为 12:00，下午为 15:00。本题完成排期登记即可，不实际发布到第三方平台。\n'
    if not messages:
        instruction=instruction.replace('需要查找的来信已同步到 oc_updates 通知群，可通过 im 业务命令读取。','').replace('需要查找的来信已同步到 oc_updates 通知群。','').replace('需要查找的来信已同步到 oc_updates 通知群，消息中保留来源联系人、标题、日期和正文。','')
    if extra.get(number,{}).get('notifications'):
        instruction+='\n使用 im +chat-list --types=p2p,group 查找接收群或私聊会话，再通过 im 业务命令发送消息。\n'
    if creates and calendarTask:
        instruction+='\n业务台账位于 base_crm / tbl_crm，使用 base 业务命令操作，collection 字段标明记录类型。\n'
    instruction+='\n当前时间固定为 2026-02-24T09:00:00Z。\n'
    (target/'instruction.md').write_text(instruction)
    (target/'task.toml').write_text(f'''schema_version = "1.4"
artifacts = [{{ source = "/var/lib/feishu-mock/state.json", service = "mock" }}]
[task]
name = "lark-gym/{slug}"
version = "0.1.0"
authors = []
[metadata]
category = "office-automation"
tags = ["feishu", "simple", "automationbench-adapted"]
source_domain = "simple"
source_id = {number}
source_commit = "{commit}"
source_task = "{info['task_name']}"
scored_domain = false
[agent]
timeout_sec = 600.0
[verifier]
timeout_sec = 120.0
environment_mode = "separate"
[environment]
build_timeout_sec = 1200.0
cpus = 2
memory_mb = 2048
storage_mb = 10240
''')
    (target/'environment/Dockerfile').write_text('FROM lark-gym-cli:0.2.0\nWORKDIR /workspace\n')
    if extra.get(number,{}).get('agent_files'):
        folder=target/'environment/input-files'
        folder.mkdir(exist_ok=True)
        for filename,encoded in extra[number]['agent_files'].items():
            assert Path(filename).name==filename and filename not in ['.','..'], ('invalid input filename',filename)
            (folder/filename).write_bytes(base64.b64decode(encoded,validate=True))
        with (target/'environment/Dockerfile').open('a') as stream:stream.write('COPY input-files/ /workspace/\n')
    (target/'environment/mock.Dockerfile').write_text('FROM lark-gym-mock:0.2.0\nCOPY seed.json /opt/mock/seed.json\n')
    (target/'environment/docker-compose.yaml').write_text('''services:
  main:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      FEISHU_MOCK_URL: http://mock:8080
    depends_on:
      mock:
        condition: service_healthy
  mock:
    build:
      context: .
      dockerfile: mock.Dockerfile
    expose: ["8080"]
    healthcheck:
      test: ["CMD", "node", "-e", "require('node:fs').accessSync('/var/lib/feishu-mock/endpoint')"]
      interval: 1s
      timeout: 5s
      retries: 30
''')
    (target/'tests/Dockerfile').write_text('FROM node:24-bookworm-slim\nCOPY . /tests\nWORKDIR /tests\n')
    (target/'tests/test.sh').write_text('#!/bin/sh\nset -eu\nnode /tests/verify.ts\n')
    (target/'tests/expected.json').write_text(json.dumps({'updates':checks,'creates':creates,'messages':messageChecks,'cells':sheetChecks,'events':eventChecks,'create_contains':extra.get(number,{}).get('create_contains',{}),**({'mail':extra[number]['mail']} if extra.get(number,{}).get('native_mail') and extra[number].get('mail') else {})},ensure_ascii=False,indent=2)+'\n')
    (target/'tests/verify.ts').write_text(Path(__file__).with_name('crm-verifier.ts').read_text())
    commands=[]
    if messages: commands.append(['im','+chat-messages-list','--chat-id','oc_updates'])
    if extra.get(number,{}).get('native_mail') and seed['mail']['messages']:
        commands.append(['mail','+messages','--mailbox',extra[number]['native_mailbox'],'--message-ids',','.join(m['message_id'] for m in seed['mail']['messages']),'--as','user'])
    commands.append(['base','+record-list','--base-token','base_crm','--table-id','tbl_crm'])
    for rid,fields in updates.items(): commands.append(['base','+record-upsert','--base-token','base_crm','--table-id','tbl_crm','--record-id',rid,'--json',json.dumps(fields,ensure_ascii=False)])
    for fields in creates: commands.append(['base','+record-upsert','--base-token','base_crm','--table-id','tbl_crm','--json',json.dumps(fields,ensure_ascii=False)])
    if calendarTask:
        commands=[c for c in commands if c[0] != 'base' or creates or updates]
        commands.extend(eventCommands)
    if sheetTask:
        commands=[c for c in commands if c[0] != 'base' or creates or updates]
        commands.append(['sheets','+cells-get','--spreadsheet-token',token,'--sheet-id',sid,'--range',f'A1:{chr(64+len(headers))}{len(values)}'])
        commands.extend(sheetCommands)
    if messageTask:
        commands=[c for c in commands if c[0] != 'base' or creates or updates]
        commands.append(['im','+chat-list','--types=p2p,group'])
        commands.append(['im','+messages-send','--chat-id',destination,'--text',messageTask['text']])
    if notificationCommands:
        commands.append(['im','+chat-list','--types=p2p,group'])
        commands.extend(notificationCommands)
    (target/'solution/solve.sh').write_text('#!/bin/sh\nset -eu\nnode /solution/solve.ts\n')
    (target/'solution/solve.ts').write_text("import { execFileSync } from 'node:child_process';\nconst commands: string[][] = "+json.dumps(commands,ensure_ascii=False,indent=2)+";\nfor (const args of commands) execFileSync(process.env.LARK_CLI || 'lark-cli', args, {stdio: 'inherit'});\n")
print('Generated',len(translations),'adapted simple task packages')
