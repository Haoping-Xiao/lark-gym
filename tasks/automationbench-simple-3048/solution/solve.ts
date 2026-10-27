import { execFileSync } from 'node:child_process';
const commands: string[][] = [
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
    'rec_hs_004',
    '--json',
    '{"hs_tag": "enterprise"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
