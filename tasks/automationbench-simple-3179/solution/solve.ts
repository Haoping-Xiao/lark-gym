import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_1f0d5f092135',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_1f0d5f092135',
    '--json',
    '{"Name": "Aisha Patel", "Email": "aisha.patel@summit.example.com", "Event": "Tech Summit 2026", "RSVP": "Confirmed"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
