import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--record-id',
    'rec_006006',
    '--json',
    '{"description": "Client requested custom ML model integration with existing data pipeline. Timeline: Q2 2026."}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
