import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'sales@company.example.com',
    '--message-ids',
    'msg_3159',
    '--as',
    'user',
  ],
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
    '{"firstname": "Jordan", "lastname": "Blake", "email": "jordan.blake@innovate.example.com", "jobtitle": "Head of IT", "company": "Innovate Inc."}',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'sales@company.example.com',
    '--message-id',
    'msg_3159',
    '--body',
    'Thank you for your interest in our Enterprise plan, Jordan. We have added your contact details.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
