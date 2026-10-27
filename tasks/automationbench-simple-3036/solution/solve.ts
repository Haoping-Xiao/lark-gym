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
    '--json',
    '{"first_name": "Yuki", "last_name": "Tanaka", "company": "Sakura Tech", "email": "yuki.tanaka@sakuratech.example.com", "phone": "+1-555-3636"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
