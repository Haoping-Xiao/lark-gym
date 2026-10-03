import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_61ffa9c8c703',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_a44f1b975171',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_a44f1b975171',
    '--json',
    '{"channel_id": "ch_facebook", "scheduled_at": "2026-03-02T09:00:00Z", "text": "想提升远程办公效率？阅读5 Remote Work Tips for Staying Productive in 2026：blog.brightpath.example.com/remote-work-tips。"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
