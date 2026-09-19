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
    '--record-id',
    'rec_003001',
    '--json',
    '{"phone": "+1-555-0101"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
