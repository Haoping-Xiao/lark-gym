import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['mail', '+messages', '--message-ids', 'msg_3008', '--as', 'user'],
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
    'rec_003008',
    '--json',
    '{"fax": "+1-555-0808"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
