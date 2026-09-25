import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'marketing@company.example.com',
    '--message-ids',
    'msg_3188',
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
    '{"firstname": "Mia", "lastname": "Torres", "email": "mia.torres@creative.example.com"}',
  ],
  [
    'mail',
    '+send',
    '--mailbox',
    'marketing@company.example.com',
    '--to',
    'mia.torres@creative.example.com',
    '--subject',
    'Welcome to our newsletter',
    '--body',
    'Welcome, Mia! Thank you for subscribing to our newsletter.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
