import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['mail', '+messages', '--message-ids', 'msg_3040', '--as', 'user'],
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
    '{"first_name": "Sophie", "last_name": "Laurent", "email": "sophie.laurent@verdeenergy.example.com", "phone": "+1-555-4040", "title": "VP of Operations", "account_name": "Verde Energy"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
