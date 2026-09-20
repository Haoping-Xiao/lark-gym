import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "tickets", "subject": "ESCALATION: Data sync failures in production", "description": "This is our 3rd day experiencing intermittent data sync failures. This is impacting 500+ users. We need immediate resolution or will consider alternatives. - Rachel Kim, VP Engineering", "priority": "high"}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CESC01',
    '--text',
    '@Support Manager 客户发生 data sync 故障，影响 500+ 用户，已建立高优先级工单。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
