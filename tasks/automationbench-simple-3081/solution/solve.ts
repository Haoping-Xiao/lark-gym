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
    '--json',
    '{"collection": "subscribers", "email": "alex.rivera@pixelworks.example.com", "list_id": "list_001"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
