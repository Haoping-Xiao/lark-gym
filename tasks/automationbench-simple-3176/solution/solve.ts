import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_b450645debe2',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_b450645debe2',
    '--json',
    '{"Name": "Jordan Lee", "Email": "jordan.lee@nexgen.example.com", "Company": "NexGen Solutions", "Role": "Product Manager"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
