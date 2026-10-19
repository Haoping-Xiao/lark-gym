import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_085154084c74',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_085154084c74',
    '--json',
    '{"name": "Onboard Priya Sharma", "workspace": "ws_hr"}',
  ],
  [
    'mail',
    '+send',
    '--mailbox',
    'agent@company.example.com',
    '--to',
    'priya.sharma@company.example.com',
    '--subject',
    'Welcome, Priya Sharma!',
    '--body',
    'Welcome to the team, Priya! We look forward to your start on March 3, 2026.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
