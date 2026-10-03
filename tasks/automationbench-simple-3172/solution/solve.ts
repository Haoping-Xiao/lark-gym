import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_02e3fe5aad80',
  ],
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
    '{"first_name": "Derek", "last_name": "Huang", "email": "derek.huang@brightpath.example.com", "company": "BrightPath Solutions"}',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_02e3fe5aad80',
    '--json',
    '{"project": "SALES", "issue_type": "Task", "summary": "跟进 Derek Huang"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
