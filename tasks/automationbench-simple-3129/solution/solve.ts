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
    '{"collection": "cards", "board": "brd_hr", "name": "Update employee handbook Q1 section", "list": "lst_hr_todo"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
