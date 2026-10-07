import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'escalations@company.example.com',
    '--message-ids',
    'msg_3187',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_f883a4577cea',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_281832285f98',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_45a5c62241ee',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_45a5c62241ee',
    '--json',
    '{"subject": "ESCALATION: Data sync failures in production", "description": "This is our 3rd day experiencing intermittent data sync failures. This is impacting 500+ users. We need immediate resolution or will consider alternatives. - Rachel Kim, VP Engineering", "priority": "high"}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CESC01',
    '--text',
    '<at user_id="ou_mock_769d30f340f7ebd3585b828c">Support Manager</at> 客户发生 data sync 故障，影响 500+ 用户，已建立高优先级工单。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
