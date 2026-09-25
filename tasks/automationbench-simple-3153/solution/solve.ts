import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'support@company.example.com',
    '--message-ids',
    'msg_3153',
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
    '{"subject": "Wrong item received - Order #ORD-8847", "description": "Hi, I ordered a blue wireless keyboard but received a black mouse instead. My order number is ORD-8847. Please help resolve this. Thanks, Maria", "tags": "billing"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
