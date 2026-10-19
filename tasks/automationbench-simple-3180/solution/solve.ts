import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'ops@company.example.com',
    '--message-ids',
    'msg_3180',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_04e2a9728af7',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_04e2a9728af7',
    '--json',
    '{"Name": "Data Migration Phase 1", "Status": "Planning"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
