import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['mail', '+messages', '--message-ids', 'msg_3042', '--as', 'user'],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aa5af4084f37',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aa5af4084f37',
    '--json',
    '{"firstname": "Nathan", "lastname": "Brooks", "email": "nathan.brooks@pinegrove.example.com", "phone": "+1-555-4242", "jobtitle": "Head of IT", "company": "PineGrove Analytics"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
