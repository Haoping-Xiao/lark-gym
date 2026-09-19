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
    '{"collection": "tasks", "subject": "Email received from client", "who_id": "003002", "description": "Hi, can we discuss the revised project timeline this week? I have a few concerns. Thanks, Natalie"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
