import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_720b6017f2e9',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_720b6017f2e9',
    '--json',
    '{"Name": "CloudForge Inc.", "Contact": "Wei Zhang", "Email": "wei.zhang@cloudforge.example.com", "Service": "Cloud Infrastructure"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
