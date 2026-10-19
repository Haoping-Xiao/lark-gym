import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aef450dc78ea',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aef450dc78ea',
    '--record-id',
    'rec_00Q002',
    '--json',
    '{"status": "Working"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
