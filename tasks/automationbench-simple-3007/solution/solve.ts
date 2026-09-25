import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['mail', '+messages', '--message-ids', 'msg_3007', '--as', 'user'],
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
    '--record-id',
    'rec_003007',
    '--json',
    '{"mobile_phone": "+1-555-0707"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
