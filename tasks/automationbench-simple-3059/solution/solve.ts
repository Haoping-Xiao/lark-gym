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
    '{"channel_id": "ch_twitter", "scheduled_at": "2026-03-03T09:00:00Z", "text": "BrightPath小技巧：按Ctrl+Shift+A即可从任意工作流步骤立即创建自动化，快来试试！"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
