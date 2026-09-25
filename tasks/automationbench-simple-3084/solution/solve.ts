import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_4f0da948ae36',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_0e89ffd80fde',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_0e89ffd80fde',
    '--json',
    '{"name": "Raj Kapoor", "email": "raj.kapoor@quantumanalytics.example.com", "company": "Quantum Analytics", "tag": "conference-2026", "list_id": "list_001"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
